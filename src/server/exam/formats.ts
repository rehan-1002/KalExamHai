import "server-only";
import type { PaperFormat } from "@/lib/schemas/paper";

export interface SubQuestionFormatBlueprint {
  marks: number;
}

export interface QuestionFormatBlueprint {
  no: number;
  marks: number;            // Attemptable marks for this question
  authoredMarks: number;     // Total authored marks across sub-questions
  compulsory: boolean;
  attempt: number;
  outOf: number;
  subMarks: number[];
  instructions: string;
}

export interface ExamFormatBlueprint {
  format: PaperFormat;
  name: string;
  totalMarks: number;        // Total attemptable marks
  totalAuthoredMarks: number;// Total marks printed on the paper
  durationMinutesDefault: number;
  creditCost: number;
  questions: QuestionFormatBlueprint[];
  instructions: string[];
}

/**
 * Single Source of Truth for Mumbai University (MU) NEP-2020 Examination Formats.
 * Strict mark breakdowns are enforced programmatically in validators and prompts.
 */
export const EXAM_FORMATS: Record<PaperFormat, ExamFormatBlueprint> = {
  IAT: {
    format: "IAT",
    name: "Internal Assessment Test (IAT)",
    totalMarks: 20,
    totalAuthoredMarks: 22, // Q1: 6*2=12 + Q2: 2*5=10 + Q3: 2*5=10 (Authored attemptable is 10+5+5=20)
    durationMinutesDefault: 60,
    creditCost: 1,
    questions: [
      {
        no: 1,
        marks: 10,
        authoredMarks: 12,
        compulsory: true,
        attempt: 5,
        outOf: 6,
        subMarks: [2, 2, 2, 2, 2, 2],
        instructions: "Question No. 1 is compulsory. Attempt any FIVE out of the following six sub-questions (2 marks each).",
      },
      {
        no: 2,
        marks: 5,
        authoredMarks: 10,
        compulsory: false,
        attempt: 1,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt any ONE sub-question out of the following two (5 marks each).",
      },
      {
        no: 3,
        marks: 5,
        authoredMarks: 10,
        compulsory: false,
        attempt: 1,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt any ONE sub-question out of the following two (5 marks each).",
      },
    ],
    instructions: [
      "Question No. 1 is compulsory: attempt any 5 of the 6 sub-questions.",
      "Attempt any 1 sub-question from Question No. 2 and any 1 sub-question from Question No. 3.",
      "Assume suitable data if necessary and state the assumptions clearly.",
      "Figures to the right indicate full marks.",
    ],
  },

  END_SEM: {
    format: "END_SEM",
    name: "End-Semester Examination (NEP-2020)",
    totalMarks: 60,          // 20 from Q1 + (4 * 10 from Q2..Q6) = 60 attemptable marks
    totalAuthoredMarks: 80,  // 30 from Q1 (6*5) + 50 from Q2..Q6 (5*10) = 80 authored marks
    durationMinutesDefault: 120,
    creditCost: 2,
    questions: [
      {
        no: 1,
        marks: 20,
        authoredMarks: 30,
        compulsory: true,
        attempt: 4,
        outOf: 6,
        subMarks: [5, 5, 5, 5, 5, 5],
        instructions: "Question No. 1 is compulsory. Attempt any FOUR out of the following six sub-questions (5 marks each).",
      },
      {
        no: 2,
        marks: 10,
        authoredMarks: 10,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt all sub-questions.",
      },
      {
        no: 3,
        marks: 10,
        authoredMarks: 10,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt all sub-questions.",
      },
      {
        no: 4,
        marks: 10,
        authoredMarks: 10,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt all sub-questions.",
      },
      {
        no: 5,
        marks: 10,
        authoredMarks: 10,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt all sub-questions.",
      },
      {
        no: 6,
        marks: 10,
        authoredMarks: 10,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [5, 5],
        instructions: "Attempt all sub-questions.",
      },
    ],
    instructions: [
      "Question No. 1 is compulsory. Attempt any 4 out of 6 sub-questions.",
      "Attempt any FOUR questions out of the remaining five questions (Question No. 2 to Question No. 6).",
      "Assume suitable data wherever necessary and state assumptions clearly.",
      "Figures to the right indicate full marks.",
    ],
  },
};

