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
 * Standard IAT Blueprint (Internal Assessment Test - 20 Marks).
 * Universal across Mumbai University engineering departments.
 */
const IAT_BLUEPRINT: ExamFormatBlueprint = {
  format: "IAT",
  name: "Internal Assessment Test (IAT)",
  totalMarks: 20,
  totalAuthoredMarks: 32, // Q1: 6*2=12 + Q2: 2*5=10 + Q3: 2*5=10
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
    "Question No. 1 is compulsory: attempt any 5 of the 6 sub-questions (2 marks each).",
    "Attempt any 1 sub-question from Question No. 2 and any 1 sub-question from Question No. 3 (5 marks each).",
    "Assume suitable data if necessary and state the assumptions clearly.",
    "Figures to the right indicate full marks.",
  ],
};

/**
 * Resolves the subject-specific Mumbai University End-Semester (NEP-2020) Blueprint.
 * Total Attemptable Marks = 15 (Q1) + 3 * 15 (Any 3 from Q2..Q6) = 60 Marks.
 */
export function getExamFormatBlueprint(format: PaperFormat, subject?: string): ExamFormatBlueprint {
  if (format === "IAT") {
    return IAT_BLUEPRINT;
  }

  const s = (subject || "").toLowerCase().trim();

  // 1. AOA (Analysis of Algorithm / Design and Analysis of Algorithms)
  // Q1: 6 sub-questions (3M each), attempt any 5 = 15M
  // Q2 to Q5: 2 sub-questions (10M + 5M) = 15M each
  // Q6: 3 sub-questions (5M + 5M + 5M) = 15M
  // Attempt any 3 from Q2..Q6 = 45M. Total = 60M.
  if (s.includes("aoa") || s.includes("analysis of algorithm") || s.includes("algorithm")) {
    return {
      format: "END_SEM",
      name: "End-Semester Examination (NEP-2020) — AOA Pattern",
      totalMarks: 60,
      totalAuthoredMarks: 93,
      durationMinutesDefault: 120,
      creditCost: 2,
      questions: [
        {
          no: 1,
          marks: 15,
          authoredMarks: 18,
          compulsory: true,
          attempt: 5,
          outOf: 6,
          subMarks: [3, 3, 3, 3, 3, 3],
          instructions: "Question No. 1 is compulsory. Attempt any FIVE out of the following six sub-questions (3 marks each).",
        },
        {
          no: 2,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [10, 5],
          instructions: "Attempt both sub-questions (10 marks and 5 marks).",
        },
        {
          no: 3,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [10, 5],
          instructions: "Attempt both sub-questions (10 marks and 5 marks).",
        },
        {
          no: 4,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [10, 5],
          instructions: "Attempt both sub-questions (10 marks and 5 marks).",
        },
        {
          no: 5,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [10, 5],
          instructions: "Attempt both sub-questions (10 marks and 5 marks).",
        },
        {
          no: 6,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 3,
          outOf: 3,
          subMarks: [5, 5, 5],
          instructions: "Attempt all THREE sub-questions (5 marks each).",
        },
      ],
      instructions: [
        "Question No. 1 is compulsory. Attempt any FIVE out of 6 sub-questions (3 marks each).",
        "Attempt any THREE questions from the remaining five questions (Question No. 2 to Question No. 6, 15 marks each).",
        "Questions No. 2 to 5 consist of two sub-questions (10 marks and 5 marks).",
        "Question No. 6 consists of three sub-questions (5 marks each).",
        "Assume suitable data wherever necessary and state assumptions clearly.",
        "Figures to the right indicate full marks.",
      ],
    };
  }

  // 2. COA (Computer Organization & Architecture)
  // Q1: 4 sub-questions (5M each), attempt any 3 = 15M
  // Q2 to Q6: 2 sub-questions (8M + 7M) = 15M each
  // Attempt any 3 from Q2..Q6 = 45M. Total = 60M.
  if (s.includes("coa") || s.includes("organization") || s.includes("architecture")) {
    return {
      format: "END_SEM",
      name: "End-Semester Examination (NEP-2020) — COA Pattern",
      totalMarks: 60,
      totalAuthoredMarks: 95,
      durationMinutesDefault: 120,
      creditCost: 2,
      questions: [
        {
          no: 1,
          marks: 15,
          authoredMarks: 20,
          compulsory: true,
          attempt: 3,
          outOf: 4,
          subMarks: [5, 5, 5, 5],
          instructions: "Question No. 1 is compulsory. Attempt any THREE out of the following four sub-questions (5 marks each).",
        },
        ...[2, 3, 4, 5, 6].map((no) => ({
          no,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [8, 7],
          instructions: "Attempt both sub-questions (8 marks and 7 marks).",
        })),
      ],
      instructions: [
        "Question No. 1 is compulsory. Attempt any THREE out of 4 sub-questions (5 marks each).",
        "Attempt any THREE questions from the remaining five questions (Question No. 2 to Question No. 6, 15 marks each with 8M and 7M split).",
        "Assume suitable data wherever necessary and state assumptions clearly.",
        "Figures to the right indicate full marks.",
      ],
    };
  }

  // 3. DSGT (Discrete Structures and Graph Theory / Discrete Mathematics)
  // Q1: 6 sub-questions (3M each), attempt any 5 = 15M
  // Q2 to Q6: 2 sub-questions (8M + 7M) = 15M each
  // Attempt any 3 from Q2..Q6 = 45M. Total = 60M.
  if (s.includes("dsgt") || s.includes("discrete structure") || s.includes("graph theory") || s.includes("discrete math")) {
    return {
      format: "END_SEM",
      name: "End-Semester Examination (NEP-2020) — DSGT Pattern",
      totalMarks: 60,
      totalAuthoredMarks: 93,
      durationMinutesDefault: 120,
      creditCost: 2,
      questions: [
        {
          no: 1,
          marks: 15,
          authoredMarks: 18,
          compulsory: true,
          attempt: 5,
          outOf: 6,
          subMarks: [3, 3, 3, 3, 3, 3],
          instructions: "Question No. 1 is compulsory. Attempt any FIVE out of the following six sub-questions (3 marks each).",
        },
        ...[2, 3, 4, 5, 6].map((no) => ({
          no,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 2,
          outOf: 2,
          subMarks: [8, 7],
          instructions: "Attempt both sub-questions (8 marks and 7 marks).",
        })),
      ],
      instructions: [
        "Question No. 1 is compulsory. Attempt any FIVE out of 6 sub-questions (3 marks each).",
        "Attempt any THREE questions from the remaining five questions (Question No. 2 to Question No. 6, 15 marks each with 8M and 7M split).",
        "Assume suitable data wherever necessary and state assumptions clearly.",
        "Figures to the right indicate full marks.",
      ],
    };
  }

  // 4. Engineering Mathematics (Mathematics for Computer Engineering / AM-I..IV / Applied Mathematics)
  // Verified from official Mumbai University End-Sem Paper (N2113111):
  // Q1: 6 sub-questions (3M each), attempt any 5 = 15M
  // Q2 to Q6: 3 sub-questions (4M + 5M + 6M = 15M each)
  // Attempt any 3 from Q2..Q6 = 45M. Total = 60M. Time: 2 Hours.
  if (s.includes("math") || s.includes("applied mathematics") || s.includes("am-") || s.includes("em-")) {
    return {
      format: "END_SEM",
      name: "End-Semester Examination (NEP-2020) — Mathematics Pattern",
      totalMarks: 60,
      totalAuthoredMarks: 93,
      durationMinutesDefault: 120,
      creditCost: 2,
      questions: [
        {
          no: 1,
          marks: 15,
          authoredMarks: 18,
          compulsory: true,
          attempt: 5,
          outOf: 6,
          subMarks: [3, 3, 3, 3, 3, 3],
          instructions: "Question No. 1 is compulsory. Attempt any FIVE out of the following six sub-questions (3 marks each).",
        },
        ...[2, 3, 4, 5, 6].map((no) => ({
          no,
          marks: 15,
          authoredMarks: 15,
          compulsory: false,
          attempt: 3,
          outOf: 3,
          subMarks: [4, 5, 6],
          instructions: "Attempt all three sub-questions (4 marks, 5 marks, and 6 marks).",
        })),
      ],
      instructions: [
        "Question No. 1 is compulsory. Attempt any FIVE out of the following six sub-questions (3 marks each).",
        "Attempt any 3 (Three) Questions from the remaining questions (Question No. 2 to Question No. 6, 15 marks each with 4M, 5M, 6M split).",
        "Statistical Table is allowed.",
        "Use of non-programmable scientific calculator is permitted.",
        "Assume suitable data wherever necessary and state assumptions clearly.",
        "Figures to the right indicate full marks.",
      ],
    };
  }

  // 5. Default Mumbai University NEP-2020 End-Sem Blueprint (OS, DBMS, CN, SE, etc.)
  // Q1: 4 sub-questions (5M each), attempt any 3 = 15M
  // Q2 to Q6: 2 sub-questions (8M + 7M) = 15M each
  // Attempt any 3 from Q2..Q6 = 45M. Total = 60M.
  return {
    format: "END_SEM",
    name: "End-Semester Examination (NEP-2020)",
    totalMarks: 60,
    totalAuthoredMarks: 95,
    durationMinutesDefault: 120,
    creditCost: 2,
    questions: [
      {
        no: 1,
        marks: 15,
        authoredMarks: 20,
        compulsory: true,
        attempt: 3,
        outOf: 4,
        subMarks: [5, 5, 5, 5],
        instructions: "Question No. 1 is compulsory. Attempt any THREE out of the following four sub-questions (5 marks each).",
      },
      ...[2, 3, 4, 5, 6].map((no) => ({
        no,
        marks: 15,
        authoredMarks: 15,
        compulsory: false,
        attempt: 2,
        outOf: 2,
        subMarks: [8, 7],
        instructions: "Attempt both sub-questions (8 marks and 7 marks).",
      })),
    ],
    instructions: [
      "Question No. 1 is compulsory. Attempt any THREE out of 4 sub-questions (5 marks each).",
      "Attempt any THREE questions from the remaining five questions (Question No. 2 to Question No. 6, 15 marks each with 8M and 7M split).",
      "Assume suitable data wherever necessary and state assumptions clearly.",
      "Figures to the right indicate full marks.",
    ],
  };
}

/**
 * Backwards compatibility export.
 */
export const EXAM_FORMATS: Record<PaperFormat, ExamFormatBlueprint> = {
  IAT: IAT_BLUEPRINT,
  END_SEM: getExamFormatBlueprint("END_SEM"),
};
