import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession, setSession } from "@/lib/store";
import { ExtractedQuestion } from "@/types/assessment";

export const EXTRACT_QUESTIONS_PROMPT = `You are extracting structured data from a scanned exam page image. Return ONLY valid JSON, no markdown fences, no commentary.

TASK: extract questions

RULES:
- Preserve exact printed numbering, including sub-parts (e.g. "11", "11(a)", "11(b)" are distinct entries — never merge them, even if printed together).
- "id": Generate a clean, lowercase, alphanumeric-only stable slug starting with "q" based on questionNumber (e.g., "11(a)" -> "q11a", "2" -> "q2").
- "questionNumber": The exact printed question label as it appears on the paper (e.g. "11(a)", "11(b)", "Q1", "2").
- "text": Transcribe the complete question text accurately.
- "page": The 1-indexed page number of the question paper where this question appears (Page 1 = 1, Page 2 = 2, etc.).
- "marksAvailable": Optional number indicating maximum marks for this question if specified (e.g. 5). Omit or set to null if not indicated.
- Do not invent questions that are not visibly present on the page.
- Do not attempt to judge whether a question was left unanswered.

OUTPUT SCHEMA:
[
  {
    "id": "q11a",
    "questionNumber": "11(a)",
    "text": "Full text of question 11(a)...",
    "page": 1,
    "marksAvailable": 5
  }
]

Return valid JSON matching this shape exactly. No prose before or after.`;

function formatImagePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    };
  }
  return {
    inlineData: {
      mimeType: "image/png",
      data: dataUrl,
    },
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sanitizeAndParseJSON(rawText: string): ExtractedQuestion[] {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Model response is not a JSON array.");
  }

  const validatedQuestions: ExtractedQuestion[] = parsed.map(
    (item: unknown, idx: number) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Item at index ${idx} is not an object.`);
      }

      const record = item as Record<string, unknown>;

      if (typeof record.id !== "string" || !record.id) {
        throw new Error(`Item at index ${idx} is missing a valid 'id' string.`);
      }

      if (typeof record.questionNumber !== "string" || !record.questionNumber) {
        throw new Error(
          `Item at index ${idx} is missing a valid 'questionNumber' string.`,
        );
      }

      if (typeof record.text !== "string") {
        throw new Error(
          `Item at index ${idx} is missing a valid 'text' string.`,
        );
      }

      const pageNum = Number(record.page);
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error(`Item at index ${idx} has an invalid 'page' number.`);
      }

      return {
        id: record.id.trim(),
        questionNumber: record.questionNumber.trim(),
        text: record.text.trim(),
        page: pageNum,
        marksAvailable:
          record.marksAvailable != null
            ? Number(record.marksAvailable)
            : undefined,
      };
    },
  );

  if (validatedQuestions.length === 0) {
    throw new Error("No valid questions found.");
  }

  return validatedQuestions;
}

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

    if (
      !session.questionPaperPages ||
      session.questionPaperPages.length === 0
    ) {
      return NextResponse.json(
        { error: "No question paper pages found in session." },
        { status: 400 },
      );
    }

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
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const imageParts = session.questionPaperPages.map((dataUrl) =>
      formatImagePart(dataUrl),
    );

    let extractedQuestions: ExtractedQuestion[] | null = null;
    let lastError: unknown = null;

    // starting chat to preserve context across multiple attempts
    const chat = model.startChat();
    // Attempt 1: Primary extraction prompt
    try {
      const response = await chat.sendMessage([
        EXTRACT_QUESTIONS_PROMPT,
        ...imageParts,
      ]);
      const responseText = response.response.text();
      extractedQuestions = sanitizeAndParseJSON(responseText);
    } catch (err: unknown) {
      console.warn("Extract questions Attempt 1 failed:", getErrorMessage(err));
      lastError = err;
    }

    // Attempt 2: Retry if Attempt 1 failed
    if (!extractedQuestions) {
      try {
        const retryPrompt = `${EXTRACT_QUESTIONS_PROMPT}\n\nCRITICAL FIX: Your previous response failed to parse as valid JSON matching the schema. Error: ${getErrorMessage(lastError)}. Please return ONLY a valid JSON array of question objects.`;
        const retryResponse = await chat.sendMessage([
          retryPrompt,
          ...imageParts,
        ]);
        const retryText = retryResponse.response.text();
        extractedQuestions = sanitizeAndParseJSON(retryText);
      } catch (err: unknown) {
        console.error(
          "Extract questions Attempt 2 failed:",
          getErrorMessage(err),
        );
        lastError = err;
      }
    }

    if (!extractedQuestions) {
      return NextResponse.json(
        {
          error: `Failed to extract valid questions after 2 attempts: ${
            getErrorMessage(lastError) || "Invalid JSON response"
          }`,
        },
        { status: 500 },
      );
    }

    session.questions = extractedQuestions;
    setSession(sessionId, session);

    return NextResponse.json({
      sessionId,
      questionsCount: extractedQuestions.length,
      questions: extractedQuestions,
    });
  } catch (error: unknown) {
    console.error("Unexpected error in extract-questions route:", error);
    return NextResponse.json(
      {
        error:
          getErrorMessage(error) ||
          "Internal server error during question extraction.",
      },
      { status: 500 },
    );
  }
}
