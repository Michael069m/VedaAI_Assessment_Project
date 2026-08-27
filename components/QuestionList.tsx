"use client";

import React, { useState } from "react";
import {
  ExtractedQuestion,
  QuestionAnswerMapping,
  GradingResult,
} from "@/types/assessment";

export interface QuestionListProps {
  questions: ExtractedQuestion[];
  mappings: QuestionAnswerMapping[];
  grading?: GradingResult[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

/**
 * Natural sort comparator for question number strings (e.g. "2", "11", "11(a)", "11(b)", "12").
 *
 * TRACE WITH EXAMPLES ("2", "11(a)", "11(b)"):
 * 1. naturalSortQuestionNumbers("2", "11(a)"):
 *    - Parses numeric prefix: 2 vs 11.
 *    - 2 < 11 => returns -1. Result: "2" comes before "11(a)".
 * 2. naturalSortQuestionNumbers("11(a)", "11(b)"):
 *    - Parses numeric prefix: 11 vs 11 (equal).
 *    - Compares non-numeric sub-parts: "(a)" vs "(b)".
 *    - 'a' < 'b' => returns -1. Result: "11(a)" comes before "11(b)".
 * 3. naturalSortQuestionNumbers("11(b)", "12"):
 *    - Parses numeric prefix: 11 vs 12.
 *    - 11 < 12 => returns -1. Result: "11(b)" comes before "12".
 */
export function naturalSortQuestionNumbers(a: string, b: string): number {
  const parseParts = (str: string) => {
    const match = str.match(/^(\d+)(.*)$/);
    if (match) {
      return { num: parseInt(match[1], 10), rest: match[2] || "" };
    }
    return { num: Number.MAX_SAFE_INTEGER, rest: str };
  };

  const partA = parseParts(a.trim());
  const partB = parseParts(b.trim());

  if (partA.num !== partB.num) {
    return partA.num - partB.num;
  }

  return partA.rest.localeCompare(partB.rest, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export default function QuestionList({
  questions,
  mappings,
  grading = [],
  selectedQuestionId,
  onSelectQuestion,
}: QuestionListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Sort questions using natural-sort order (not extraction order)
  const sortedQuestions = [...questions].sort((a, b) =>
    naturalSortQuestionNumbers(a.questionNumber, b.questionNumber),
  );

  const mappingsByQId = new Map(
    mappings.filter((m) => m.questionId != null).map((m) => [m.questionId!, m]),
  );
  const gradingByQId = new Map(grading.map((g) => [g.questionId, g]));

  return (
    <div className="space-y-3 w-full px-3 py-3">
      <div className="flex items-center justify-between px-1 pb-1">
        <h2 className="text-[11px] font-extrabold tracking-[0.18em] text-slate-500 uppercase">
          Questions List ({questions.length})
        </h2>
        <span className="text-[11px] text-slate-400">Natural Sorted</span>
      </div>

      {sortedQuestions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          No questions available.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map((q) => {
            const isSelected = selectedQuestionId === q.id;
            const mapping = mappingsByQId.get(q.id);
            const grade = gradingByQId.get(q.id);
            const isExpanded = !!expandedIds[q.id];

            const status = mapping ? mapping.status : "unanswered";
            const isAnswered = status === "matched";

            return (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className={`group relative cursor-pointer rounded-[20px] border p-4 transition-all duration-200 ${
                  isSelected
                    ? "bg-[#FFF7F0] border-[#F97316] shadow-[0_14px_30px_rgba(249,115,22,0.14)]"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                }`}
              >
                {/* Main Row: Question Number, Text, Score Badge, and Expand Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Question Number Badge */}
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold font-mono shrink-0 shadow-sm ${
                        isSelected
                          ? "bg-[#F97316] text-white"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {q.questionNumber}
                    </span>

                    {/* Question Text */}
                    <p className="text-[13px] font-medium text-slate-800 leading-snug pt-1.5 flex-1">
                      {q.text}
                    </p>
                  </div>

                  {/* Right side: Points & Chevron/Toggle */}
                  <div className="flex items-center gap-2.5 shrink-0 pt-1">
                    {grade && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
                        {grade.marksAwarded}/{grade.marksTotal}
                      </span>
                    )}

                    {grade && (
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(q.id, e)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border ${
                          isExpanded
                            ? "bg-slate-100 border-slate-300 text-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                        aria-label="Toggle Feedback"
                      >
                        <span className="text-xs">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden/Collapsible Feedback Box resembling reference card */}
                {grade && isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200/60 animate-in fade-in duration-150">
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            grade.verdict === "correct"
                              ? "bg-emerald-500"
                              : grade.verdict === "partially_correct"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        ></span>
                        <span className="text-[11px] font-bold tracking-wide uppercase text-slate-700">
                          AI Feedback
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed">
                        {grade.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
