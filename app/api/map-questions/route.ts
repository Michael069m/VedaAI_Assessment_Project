import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/store";
import { mapAnswers } from "@/lib/mapAnswers";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

    const questions = session.questions || [];
    const answers = session.answers || [];

    const { mergedAnswers, mappings } = mapAnswers(questions, answers);

    session.answers = mergedAnswers;
    session.mappings = mappings;
    setSession(sessionId, session);

    return NextResponse.json({
      sessionId,
      mappingsCount: mappings.length,
      answers: mergedAnswers,
      mappings,
    });
  } catch (error: unknown) {
    console.error("Unexpected error in map-questions route:", error);
    return NextResponse.json(
      {
        error:
          getErrorMessage(error) ||
          "Internal server error during question-answer mapping.",
      },
      { status: 500 },
    );
  }
}
