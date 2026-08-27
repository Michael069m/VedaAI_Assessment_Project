import { NextRequest, NextResponse } from "next/server";
import { setSession, SessionData } from "@/lib/store";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const MAX_RENDER_DIMENSION = 1600;

// NOTE: PDF rasterization is handled server-side using pdfjs-dist (legacy Node build)
// combined with @napi-rs/canvas to render each page into a PNG base64 data URL.
// No Gemini API calls are executed in this phase.

async function processUploadedFile(file: File): Promise<string[]> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const pageImages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1.0 });
      const renderScale = Math.min(
        2.0,
        MAX_RENDER_DIMENSION /
          Math.max(baseViewport.width, baseViewport.height),
      );
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");

      const renderContext = {
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
      };

      await page.render(renderContext).promise;

      const imgBuffer = canvas.toBuffer("image/png");
      pageImages.push(`data:image/png;base64,${imgBuffer.toString("base64")}`);
    }

    return pageImages;
  } else {
    // For single image uploads (PNG/JPG), convert directly to base64 data URL
    const mimeType =
      file.type ||
      (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    const base64 = buffer.toString("base64");
    return [`data:${mimeType};base64,${base64}`];
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const questionPaperFile =
      (formData.get("questionPaper") as File | null) ||
      (formData.get("question_paper") as File | null);

    const studentAnswerSheetFile =
      (formData.get("studentAnswerSheet") as File | null) ||
      (formData.get("answerSheet") as File | null) ||
      (formData.get("student_answer_sheet") as File | null);

    if (!questionPaperFile || !studentAnswerSheetFile) {
      return NextResponse.json(
        {
          error:
            "Both questionPaper and studentAnswerSheet files are required.",
        },
        { status: 400 },
      );
    }

    // Rasterize PDF pages / parse images server-side
    const [questionPaperPages, answerSheetPages] = await Promise.all([
      processUploadedFile(questionPaperFile),
      processUploadedFile(studentAnswerSheetFile),
    ]);

    const sessionId = crypto.randomUUID();

    const sessionData: SessionData = {
      sessionId,
      questionPaperPages,
      answerSheetPages,
      questions: [],
      answers: [],
      mappings: [],
      grading: [],
    };

    setSession(sessionId, sessionData);

    return NextResponse.json({
      sessionId,
      questionPaperPageCount: questionPaperPages.length,
      answerSheetPageCount: answerSheetPages.length,
    });
  } catch (error: unknown) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to process uploaded files." },
      { status: 500 },
    );
  }
}
