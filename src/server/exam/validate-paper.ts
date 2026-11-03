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
 * Programmatic NEP-2020 Question Paper Validator & Auto-Repair Engine.
 * Verifies and auto-repairs blueprint mark distribution, attempt rules, and compulsory blocks in code.
 * Eliminates slow LLM re-generation penalties for minor mathematical or metadata discrepancies.
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
    warnings.push(
      `Question count discrepancy: expected ${blueprint.questions.length} questions, received ${paper.questions.length}. Auto-normalizing.`
    );
  }

  const sanitizedQuestions = [];

  for (let i = 0; i < blueprint.questions.length; i++) {
    const qBlueprint = blueprint.questions[i]!;
    // Match by question number or fallback to index position
    const qActual = paper.questions.find((q) => q.no === qBlueprint.no) || paper.questions[i];

    if (!qActual) {
      errors.push(`Missing Question No. ${qBlueprint.no} in generated paper.`);
      continue;
    }

    // Auto-repair compulsory flag & attempt rules according to strict NEP-2020 blueprint
    const compulsory = qBlueprint.compulsory;
    const attemptCount = qBlueprint.attempt;
    const outOf = qBlueprint.outOf;
    const totalMarks = qBlueprint.marks;
    const instructions = qActual.instructions || qBlueprint.instructions;

    // Verify sub-question presence and sanitize text
    const sanitizedSubQuestions = [];
    const sourceSubQuestions = qActual.sub_questions || [];

    for (let j = 0; j < qBlueprint.outOf; j++) {
      const sub = sourceSubQuestions[j];
      const expectedMarks = qBlueprint.subMarks[j] ?? (totalMarks / outOf);
      const expectedLabel = String.fromCharCode(97 + j); // 'a', 'b', 'c', etc.

      if (!sub) {
        errors.push(`Question ${qBlueprint.no}(${expectedLabel}) missing sub-question content.`);
        continue;
      }

      // Check text is not empty
      if (!sub.text || sub.text.trim().length < 5) {
        errors.push(`Question ${qBlueprint.no}(${expectedLabel}) has empty or invalid question text.`);
        continue;
      }

      // Auto-repair marks to match blueprint specification in 0ms
      const actualMarks = expectedMarks;
      if (sub.marks !== expectedMarks) {
        warnings.push(
          `Question ${qBlueprint.no}(${sub.label || expectedLabel}) marks auto-normalized from ${sub.marks}M to ${expectedMarks}M.`
        );
      }

      // Validate source chunk citations
      if (validChunkIds.size > 0) {
        if (!sub.source_chunk_ids || sub.source_chunk_ids.length === 0) {
          warnings.push(`Question ${qBlueprint.no}(${expectedLabel}) lacks source chunk citation.`);
        }
      }

      // Sanitize LaTeX
      const latexCheck = sanitizeLatex(sub.text);
      if (latexCheck.hasWarnings) {
        warnings.push(...latexCheck.warnings.map((w) => `Question ${qBlueprint.no}(${expectedLabel}): ${w}`));
      }

      sanitizedSubQuestions.push({
        id: sub.id || `q${qBlueprint.no}_${expectedLabel}`,
        label: sub.label || expectedLabel,
        marks: actualMarks,
        text: latexCheck.text,
        source_chunk_ids: sub.source_chunk_ids || [],
        unit_label: sub.unit_label || `Module ${(qBlueprint.no % 6) + 1}`,
      });
    }

    sanitizedQuestions.push({
      no: qBlueprint.no,
      compulsory,
      total_marks: totalMarks,
      attempt_count: attemptCount,
      out_of: outOf,
      instructions,
      sub_questions: sanitizedSubQuestions,
    });
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
