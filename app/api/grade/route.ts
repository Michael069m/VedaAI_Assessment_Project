import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession, setSession } from "@/lib/store";
import { GradingResult } from "@/types/assessment";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const GRADE_PROMPT_SYSTEM = `You are an expert academic examiner. Grade the provided batch of student answers against their respective questions.

OUTPUT FORMAT:
Return ONLY a valid JSON array of grading objects matching this exact structure:
[
  {
    "questionId": "q11a",
    "marksAwarded": 4,
    "marksTotal": 5,
    "verdict": "partially_correct",
    "feedback": "The student correctly derived the primary equation but made an arithmetic error in the final step."
  }
]

RULES:
1. You MUST include a grading object for EVERY questionId listed in the input array.
2. "questionId": Must EXACTLY match the questionId provided in the input. Do NOT invent or alter questionIds.
3. "marksAwarded": An integer or float from 0 up to marksTotal.
4. "marksTotal": The maximum available marks specified for the question (default to 10 if omitted).
5. "verdict": Must be one of: "correct", "partially_correct", "incorrect", "ungraded".
6. "feedback": A concise 1-2 sentence constructive evaluation explaining the grade.
7. Return ONLY the raw JSON array. No markdown code fences, no conversational preambles.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required in request body." },
        { status: 400 },
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: `Session not found for sessionId: ${sessionId}` },
        { status: 404 },
      );
    }

    const questionsMap = new Map(
      (session.questions || []).map((q) => [q.id, q]),
    );
    const answersMap = new Map((session.answers || []).map((a) => [a.id, a]));
    const mappings = session.mappings || [];

    const gradingResults: GradingResult[] = [];

    // 1. Process "unanswered" mappings directly (skip AI call)
    for (const mapping of mappings) {
      if (mapping.status === "unanswered" && mapping.questionId) {
        const question = questionsMap.get(mapping.questionId);
        const marksTotal =
          question?.marksAvailable != null ? question.marksAvailable : 10;
        gradingResults.push({
          questionId: mapping.questionId,
          marksAwarded: 0,
          marksTotal: marksTotal,
          verdict: "ungraded",
          feedback: "Not answered.",
        });
      }
    }

    // 2. Collect all "matched" pairs into a SINGLE batch for one Gemini call
    const matchedPairsToGrade = mappings
      .filter((m) => m.status === "matched" && m.questionId && m.answerId)
      .map((m) => {
        const q = questionsMap.get(m.questionId!);
        const a = answersMap.get(m.answerId!);
        if (!q || !a) return null;
        return {
          questionId: q.id,
          questionNumber: q.questionNumber,
          questionText: q.text,
          marksAvailable: q.marksAvailable != null ? q.marksAvailable : 10,
          studentAnswerText: a.text,
          answerPage: a.boundingBoxes[0]?.page ?? null,
        };
      })
      .filter(Boolean) as {
      questionId: string;
      questionNumber: string;
      questionText: string;
      marksAvailable: number;
      studentAnswerText: string;
      answerPage: number | null;
    }[];

    // If there are matched pairs to grade, invoke Gemini in a single text-only call
    if (matchedPairsToGrade.length > 0) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY environment variable is not configured." },
          { status: 500 },
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: GRADE_PROMPT_SYSTEM,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const batchContentPayload = `QUESTIONS AND ANSWERS BATCH TO GRADE:\n${JSON.stringify(
        matchedPairsToGrade,
        null,
        2,
      )}`;

      const resultMap = new Map<string, GradingResult>();
      let batchSuccess = false;

      const chat = model.startChat();

      // Attempt 1: Batch call
      try {
        const response = await chat.sendMessage([batchContentPayload]);
        let rawText = response.response.text().trim();
        if (rawText.startsWith("```")) {
          rawText = rawText
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");
        }
        const parsed = JSON.parse(rawText);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item.questionId === "string") {
              const qId = item.questionId.trim();
              const marksTotal = Number(item.marksTotal) || 10;
              const marksAwarded = Math.max(
                0,
                Math.min(marksTotal, Number(item.marksAwarded) || 0),
              );
              const batchInput = matchedPairsToGrade.find(
                (pair) => pair.questionId === qId,
              );

              resultMap.set(qId, {
                questionId: qId,
                marksAwarded,
                marksTotal,
                verdict: [
                  "correct",
                  "partially_correct",
                  "incorrect",
                  "ungraded",
                ].includes(item.verdict)
                  ? item.verdict
                  : "ungraded",
                feedback:
                  typeof item.feedback === "string"
                    ? item.feedback.trim()
                    : "Graded by AI examiner.",
                answerPage: batchInput?.answerPage ?? undefined,
              });
            }
          }
          batchSuccess = true;
        }
      } catch (err: unknown) {
        console.warn("Batch grading Attempt 1 failed:", getErrorMessage(err));
      }

      // Attempt 2: Retry if Attempt 1 failed
      if (!batchSuccess || resultMap.size === 0) {
        try {
          const retryPrompt = `CRITICAL FIX: Your previous response failed to parse as valid JSON. Please return ONLY a valid JSON array of grading objects matching the specified schema.`;
          const response = await chat.sendMessage([retryPrompt]);
          let rawText = response.response.text().trim();
          if (rawText.startsWith("```")) {
            rawText = rawText
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/, "");
          }
          const parsed = JSON.parse(rawText);

          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item.questionId === "string") {
                const qId = item.questionId.trim();
                const marksTotal = Number(item.marksTotal) || 10;
                const marksAwarded = Math.max(
                  0,
                  Math.min(marksTotal, Number(item.marksAwarded) || 0),
                );
                const batchInput = matchedPairsToGrade.find(
                  (pair) => pair.questionId === qId,
                );

                resultMap.set(qId, {
                  questionId: qId,
                  marksAwarded,
                  marksTotal,
                  verdict: [
                    "correct",
                    "partially_correct",
                    "incorrect",
                    "ungraded",
                  ].includes(item.verdict)
                    ? item.verdict
                    : "ungraded",
                  feedback:
                    typeof item.feedback === "string"
                      ? item.feedback.trim()
                      : "Graded by AI examiner.",
                  answerPage: batchInput?.answerPage ?? undefined,
                });
              }
            }
          }
        } catch (err: unknown) {
          console.error(
            "Batch grading Attempt 2 failed:",
            getErrorMessage(err),
          );
        }
      }

      // Explicit ID matching step: Match results by questionId (never by array position)
      for (const pair of matchedPairsToGrade) {
        const result = resultMap.get(pair.questionId);
        if (result) {
          gradingResults.push(result);
        } else {
          console.warn(
            `QuestionId '${pair.questionId}' missing from Gemini batch grading response. Applying safe fallback.`,
          );
          gradingResults.push({
            questionId: pair.questionId,
            marksAwarded: 0,
            marksTotal: pair.marksAvailable,
            verdict: "ungraded",
            feedback: "AI evaluation unavailable for this question.",
          });
        }
      }
    }

    // Save grading results into session store
    session.grading = gradingResults;
    setSession(sessionId, session);

    return NextResponse.json({
      sessionId,
      gradingCount: gradingResults.length,
      grading: gradingResults,
    });
  } catch (error: unknown) {
    console.error("Unexpected error in grade route:", error);
    return NextResponse.json(
      {
        error:
          getErrorMessage(error) ||
          "Internal server error during grading evaluation.",
      },
      { status: 500 },
    );
  }
}
