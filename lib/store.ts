import { AssessmentSession } from "@/types/assessment";

export interface SessionData extends AssessmentSession {
  questionPaperPages: string[];
}

// Persist the in-memory map across Next.js dev reloads using globalThis
const globalStore = globalThis as unknown as {
  assessmentSessions?: Map<string, SessionData>;
};

if (!globalStore.assessmentSessions) {
  globalStore.assessmentSessions = new Map<string, SessionData>();
}

const sessionStore = globalStore.assessmentSessions;

/**
 * Retrieves an AssessmentSession from the in-memory store by sessionId.
 */
export function getSession(sessionId: string): SessionData | undefined {
  return sessionStore.get(sessionId);
}

/**
 * Stores or updates an AssessmentSession in the in-memory store keyed by sessionId.
 */
export function setSession(sessionId: string, session: SessionData): void {
  sessionStore.set(sessionId, session);
}
