export interface BoundingBox {
  page: number; // 1-indexed page number within the answer sheet
  ymin: number; // 0-100, percentage of image height
  xmin: number; // 0-100, percentage of image width
  ymax: number;
  xmax: number;
}

export interface ExtractedQuestion {
  id: string; // stable slug, e.g. "q11a" — generated from questionNumber
  questionNumber: string; // exact printed label, e.g. "11", "11(a)", "2"
  text: string;
  page: number; // page in question paper
  marksAvailable?: number;
}

export interface ExtractedAnswer {
  id: string; // stable slug, e.g. "a1"
  detectedQuestionNumber: string | null; // what the student wrote/what model inferred, or null if illegible/absent
  text: string; // transcribed handwritten text (best-effort)
  boundingBoxes: BoundingBox[]; // multiple if the answer spans pages/regions
  inferredContinuation?: boolean; // true if auto-merged continuation across pages
}

export type MappingStatus = "matched" | "unanswered" | "orphan";

export interface QuestionAnswerMapping {
  questionId: string | null; // null only for orphan entries
  answerId: string | null; // null only for unanswered entries
  status: MappingStatus;
  confidence: number; // 0-1, from string-similarity between questionNumber and detectedQuestionNumber
}

export interface GradingResult {
  questionId: string;
  marksAwarded: number;
  marksTotal: number;
  verdict: "correct" | "partially_correct" | "incorrect" | "ungraded";
  feedback: string;
  answerPage?: number;
}

export interface AssessmentSession {
  sessionId: string;
  questions: ExtractedQuestion[];
  answers: ExtractedAnswer[];
  mappings: QuestionAnswerMapping[];
  grading?: GradingResult[];
  answerSheetPages: string[]; // base64 or object URLs, indexed by page-1
}
