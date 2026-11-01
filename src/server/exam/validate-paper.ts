import "server-only";
import type { PaperJson } from "@/lib/schemas/paper";
import { EXAM_FORMATS } from "./formats";
import { sanitizeLatex } from "./sanitize-latex";

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPaper: PaperJson;
}

/**
 * Programmatic NEP-2020 Question Paper Validator.
 * Verifies exact mark distribution, attempt rules, compulsory blocks, and chunk citations.
 * A paper that fails validation is rejected and never presented to the tutor.
 */
export function validatePaper(
  paper: PaperJson,
  validChunkIds: Set<string>
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blueprint = EXAM_FORMATS[paper.format];

  if (!blueprint) {
    return {
      valid: false,
      errors: [`Unrecognized paper format: ${paper.format}`],
      warnings: [],
      sanitizedPaper: paper,
    };
  }

  // 1. Verify question count
  if (paper.questions.length !== blueprint.questions.length) {
    errors.push(
      `Question count mismatch: expected ${blueprint.questions.length} questions, received ${paper.questions.length}.`
    );
  }

  let calculatedAttemptableTotal = 0;
  const sanitizedQuestions = [];

  for (let i = 0; i < blueprint.questions.length; i++) {
    const qBlueprint = blueprint.questions[i]!;
    const qActual = paper.questions.find((q) => q.no === qBlueprint.no);

    if (!qActual) {
      errors.push(`Missing Question No. ${qBlueprint.no} in generated paper.`);
      continue;
    }

    // Verify compulsory flag
    if (qActual.compulsory !== qBlueprint.compulsory) {
      errors.push(
        `Question ${qActual.no} compulsory mismatch: expected ${qBlueprint.compulsory}, got ${qActual.compulsory}.`
      );
    }

    // Verify sub-question count
    if (qActual.sub_questions.length !== qBlueprint.outOf) {
      errors.push(
        `Question ${qActual.no} sub-question count mismatch: expected ${qBlueprint.outOf}, got ${qActual.sub_questions.length}.`
      );
    }

    // Verify individual sub-question marks and sanitize text
    const sanitizedSubQuestions = [];
    let questionSubMarksSum = 0;

    for (let j = 0; j < qActual.sub_questions.length; j++) {
      const sub = qActual.sub_questions[j]!;
      const expectedMarks = qBlueprint.subMarks[j];

      if (expectedMarks !== undefined && sub.marks !== expectedMarks) {
        errors.push(
          `Question ${qActual.no}(${sub.label}) marks mismatch: expected ${expectedMarks}M, got ${sub.marks}M.`
        );
      }

      // Check text is not empty
      if (!sub.text || sub.text.trim().length < 5) {
        errors.push(`Question ${qActual.no}(${sub.label}) has empty or invalid question text.`);
      }

      // Validate source chunk citations
      if (validChunkIds.size > 0) {
        if (!sub.source_chunk_ids || sub.source_chunk_ids.length === 0) {
          warnings.push(`Question ${qActual.no}(${sub.label}) lacks source chunk citation.`);
        } else {
          for (const chunkId of sub.source_chunk_ids) {
            if (!validChunkIds.has(chunkId)) {
              warnings.push(`Question ${qActual.no}(${sub.label}) references unknown chunk ID: ${chunkId}`);
            }
          }
        }
      }

      // Sanitize LaTeX
      const latexCheck = sanitizeLatex(sub.text);
      if (latexCheck.hasWarnings) {
        warnings.push(...latexCheck.warnings.map((w) => `Question ${qActual.no}(${sub.label}): ${w}`));
      }

      questionSubMarksSum += sub.marks;
      sanitizedSubQuestions.push({
        ...sub,
        text: latexCheck.text,
      });
    }

    calculatedAttemptableTotal += qActual.total_marks;

    sanitizedQuestions.push({
      ...qActual,
      sub_questions: sanitizedSubQuestions,
    });
  }

  // Verify total attemptable marks
  if (calculatedAttemptableTotal !== blueprint.totalMarks) {
    errors.push(
      `Total attemptable marks mismatch: expected ${blueprint.totalMarks} marks, calculated ${calculatedAttemptableTotal} marks.`
    );
  }

  const sanitizedPaper: PaperJson = {
    ...paper,
    total_attemptable_marks: blueprint.totalMarks,
    total_authored_marks: blueprint.totalAuthoredMarks,
    duration_minutes: paper.duration_minutes || blueprint.durationMinutesDefault,
    questions: sanitizedQuestions,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedPaper,
  };
}

