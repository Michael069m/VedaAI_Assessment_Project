import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/store";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId parameter is required." },
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

    return NextResponse.json({ session });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to retrieve session." },
      { status: 500 },
    );
  }
}
