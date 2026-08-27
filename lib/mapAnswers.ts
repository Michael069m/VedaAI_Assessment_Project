import {
  ExtractedQuestion,
  ExtractedAnswer,
  QuestionAnswerMapping,
  BoundingBox,
} from "@/types/assessment";

/**
 * Normalizes question number strings for strict/fuzzy comparison.
 * Strips whitespace, converts to lowercase, and removes punctuation/parentheses.
 *
 * MENTAL UNIT TESTS:
 * 1. normalizeQuestionNumber("11(a)") => "11a"
 * 2. normalizeQuestionNumber("11 a")  => "11a"
 * 3. normalizeQuestionNumber("11a")   => "11a"
 * All three inputs produce the identical normalized string "11a".
 */
export function normalizeQuestionNumber(label: string | null): string {
  if (!label) return "";
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getQuestionFamilyKey(label: string | null): string {
  if (!label) return "";

  const trimmed = label.trim();
  const match = trimmed.match(/^(?:q\s*)?(\d+)/i);
  if (match) {
    return match[1];
  }

  return normalizeQuestionNumber(trimmed);
}

function getAnswerAnchor(answer: ExtractedAnswer): {
  page: number;
  ymin: number;
} {
  const firstBox = answer.boundingBoxes[0];
  if (!firstBox) {
    return { page: Number.MAX_SAFE_INTEGER, ymin: Number.MAX_SAFE_INTEGER };
  }

  return {
    page: firstBox.page,
    ymin: firstBox.ymin,
  };
}

/**
 * Normalizes bounding box coordinates to 0-1000 scale for position comparisons.
 */
function getNormalizedYValues(box: BoundingBox): {
  ymin: number;
  ymax: number;
} {
  const is100Scale = box.ymax <= 100 && box.ymin <= 100;
  return {
    ymin: is100Scale ? box.ymin * 10 : box.ymin,
    ymax: is100Scale ? box.ymax * 10 : box.ymax,
  };
}

/**
 * STEP 0 — Merges multi-page continuations BEFORE mapping.
 * 1. Combines answers sharing the same non-null normalized detectedQuestionNumber.
 * 2. Auto-detects unlabeled continuation blocks (null detectedQuestionNumber near page top
 *    following an answer ending near bottom of preceding page) and marks inferredContinuation: true.
 */
export function mergeContinuationAnswers(
  answers: ExtractedAnswer[],
): ExtractedAnswer[] {
  if (!answers || answers.length === 0) return [];

  // Group non-null-numbered answers by normalized question number
  const groupedAnswersMap = new Map<string, ExtractedAnswer[]>();
  const nullNumberedAnswers: ExtractedAnswer[] = [];

  for (const ans of answers) {
    const norm = normalizeQuestionNumber(ans.detectedQuestionNumber);
    if (norm) {
      const existing = groupedAnswersMap.get(norm) || [];
      existing.push(ans);
      groupedAnswersMap.set(norm, existing);
    } else {
      nullNumberedAnswers.push(ans);
    }
  }

  // 1. Merge non-null numbered duplicates
  const mergedList: ExtractedAnswer[] = [];

  for (const [, group] of groupedAnswersMap) {
    if (group.length === 1) {
      mergedList.push({ ...group[0] });
    } else {
      // Merge multiple entries sharing the same question label
      const base = group[0];
      let combinedText = base.text;
      const combinedBoxes: BoundingBox[] = [...base.boundingBoxes];

      for (let i = 1; i < group.length; i++) {
        combinedText += "\n" + group[i].text;
        combinedBoxes.push(...group[i].boundingBoxes);
      }

      // Sort bounding boxes by page ascending, then ymin ascending
      combinedBoxes.sort((a, b) => a.page - b.page || a.ymin - b.ymin);

      mergedList.push({
        ...base,
        text: combinedText,
        boundingBoxes: combinedBoxes,
      });
    }
  }

  // 2. Check null-numbered answers for continuation candidates
  for (const nullAns of nullNumberedAnswers) {
    const firstBox = nullAns.boundingBoxes[0];
    if (!firstBox) {
      mergedList.push(nullAns);
      continue;
    }

    const { ymin: nullYmin } = getNormalizedYValues(firstBox);
    const nullPage = firstBox.page;

    // Check if null answer is near the top of its page (ymin < 150 on 0-1000 scale)
    const isNearTop = nullYmin < 150;

    if (isNearTop && nullPage > 1) {
      // Find candidate answers on preceding page (nullPage - 1) whose last box is near bottom (ymax > 850)
      const candidateMatches: ExtractedAnswer[] = [];

      for (const candidate of mergedList) {
        const candidateBoxes = candidate.boundingBoxes;
        const lastCandidateBox = candidateBoxes[candidateBoxes.length - 1];

        if (lastCandidateBox && lastCandidateBox.page === nullPage - 1) {
          const { ymax: candYmax } = getNormalizedYValues(lastCandidateBox);
          if (candYmax > 850) {
            candidateMatches.push(candidate);
          }
        }
      }

      // Only merge if there is EXACTLY one unambiguous candidate match
      if (candidateMatches.length === 1) {
        const candidate = candidateMatches[0];
        candidate.text += "\n" + nullAns.text;
        candidate.boundingBoxes.push(...nullAns.boundingBoxes);
        candidate.boundingBoxes.sort(
          (a, b) => a.page - b.page || a.ymin - b.ymin,
        );
        candidate.inferredContinuation = true;
        continue; // Merged into candidate, skip adding as separate entry
      }
    }

    // Otherwise leave as a separate orphan answer
    mergedList.push(nullAns);
  }

  return mergedList;
}

function mergeAnswerGroup(group: ExtractedAnswer[]): ExtractedAnswer {
  if (group.length === 1) {
    return {
      ...group[0],
      boundingBoxes: [...group[0].boundingBoxes],
    };
  }

  const sortedGroup = [...group].sort((a, b) => {
    const firstA = a.boundingBoxes[0];
    const firstB = b.boundingBoxes[0];

    if (!firstA || !firstB) return 0;

    return firstA.page - firstB.page || firstA.ymin - firstB.ymin;
  });

  const base = sortedGroup[0];
  const combinedText = sortedGroup.map((answer) => answer.text).join("\n");
  const combinedBoxes = sortedGroup
    .flatMap((answer) => answer.boundingBoxes)
    .sort((a, b) => a.page - b.page || a.ymin - b.ymin);

  return {
    ...base,
    text: combinedText,
    boundingBoxes: combinedBoxes,
  };
}

/**
 * STEP 1 — Maps questions to merged answers.
 * Returns the merged answer array and the computed QuestionAnswerMapping array.
 */
export function mapAnswers(
  questions: ExtractedQuestion[],
  answers: ExtractedAnswer[],
): { mergedAnswers: ExtractedAnswer[]; mappings: QuestionAnswerMapping[] } {
  const continuationMergedAnswers = mergeContinuationAnswers(answers);

  const exactQuestionLookup = new Map<string, ExtractedQuestion>();
  const familyQuestionLookup = new Map<string, ExtractedQuestion[]>();

  for (const question of questions) {
    const exactKey = normalizeQuestionNumber(question.questionNumber);
    exactQuestionLookup.set(exactKey, question);

    const familyKey = getQuestionFamilyKey(question.questionNumber);
    const existingFamily = familyQuestionLookup.get(familyKey) || [];
    existingFamily.push(question);
    familyQuestionLookup.set(familyKey, existingFamily);
  }

  const answerGroupsByQuestionId = new Map<string, ExtractedAnswer[]>();
  const orphanAnswers: ExtractedAnswer[] = [];

  for (const answer of continuationMergedAnswers) {
    const exactKey = normalizeQuestionNumber(answer.detectedQuestionNumber);
    const exactQuestion = exactKey
      ? exactQuestionLookup.get(exactKey)
      : undefined;

    if (exactQuestion) {
      const group = answerGroupsByQuestionId.get(exactQuestion.id) || [];
      group.push(answer);
      answerGroupsByQuestionId.set(exactQuestion.id, group);
      continue;
    }

    const familyKey = getQuestionFamilyKey(answer.detectedQuestionNumber);
    const familyQuestions = familyKey
      ? familyQuestionLookup.get(familyKey)
      : undefined;

    if (familyQuestions && familyQuestions.length === 1) {
      const [familyQuestion] = familyQuestions;
      const group = answerGroupsByQuestionId.get(familyQuestion.id) || [];
      group.push(answer);
      answerGroupsByQuestionId.set(familyQuestion.id, group);
      continue;
    }

    orphanAnswers.push(answer);
  }

  const mergedAnswers: ExtractedAnswer[] = [];
  const mappings: QuestionAnswerMapping[] = [];
  const fallbackQuestions: ExtractedQuestion[] = [];
  const fallbackAnswers = [...orphanAnswers].sort(
    (a, b) =>
      getAnswerAnchor(a).page - getAnswerAnchor(b).page ||
      getAnswerAnchor(a).ymin - getAnswerAnchor(b).ymin,
  );

  for (const question of questions) {
    const groupedAnswers = answerGroupsByQuestionId.get(question.id) || [];

    if (groupedAnswers.length > 0) {
      const mergedAnswer = mergeAnswerGroup(groupedAnswers);
      const confidence = groupedAnswers.length > 1 ? 0.75 : 1.0;

      answerGroupsByQuestionId.set(question.id, [mergedAnswer]);
      mergedAnswers.push(mergedAnswer);

      mappings.push({
        questionId: question.id,
        answerId: mergedAnswer.id,
        status: "matched",
        confidence,
      });
      continue;
    }

    fallbackQuestions.push(question);
  }

  const fallbackLimit = Math.min(
    fallbackQuestions.length,
    fallbackAnswers.length,
  );
  for (let index = 0; index < fallbackLimit; index++) {
    const question = fallbackQuestions[index];
    const answer = fallbackAnswers[index];

    answerGroupsByQuestionId.set(question.id, [answer]);
    mergedAnswers.push(answer);

    mappings.push({
      questionId: question.id,
      answerId: answer.id,
      status: "matched",
      confidence: 0.55,
    });
  }

  for (const question of questions) {
    if (answerGroupsByQuestionId.has(question.id)) {
      continue;
    }

    mappings.push({
      questionId: question.id,
      answerId: null,
      status: "unanswered",
      confidence: 0,
    });
  }

  for (const ans of fallbackAnswers.slice(fallbackLimit)) {
    mergedAnswers.push(ans);
    mappings.push({
      questionId: null,
      answerId: ans.id,
      status: "orphan",
      confidence: 0,
    });
  }

  return { mergedAnswers, mappings };
}
