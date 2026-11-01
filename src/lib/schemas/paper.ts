import { z } from "zod";

export const BloomLevelSchema = z.enum([
  "L1_REMEMBER",
  "L2_UNDERSTAND",
  "L3_APPLY",
  "L4_ANALYZE",
  "L5_EVALUATE",
  "L6_CREATE",
]);

export const SubQuestionSchema = z.object({
  id: z.string(),
  label: z.string(), // "a", "b", "c", etc.
  text: z.string(),  // Plain text + LaTeX formulas ($...$ or $$...$$)
  marks: z.number().int().positive(),
  source_chunk_ids: z.array(z.string()).default([]),
  unit_label: z.string().optional(),
  bloom_level: BloomLevelSchema.optional(),
  coverage_warning: z.string().optional(),
});

export const QuestionSchema = z.object({
  no: z.number().int().positive(),
  title: z.string().optional(),
  compulsory: z.boolean(),
  total_marks: z.number().int().positive(), // Attemptable marks for this question block
  attempt_count: z.number().int().positive(),
  out_of: z.number().int().positive(),
  instructions: z.string(),
  sub_questions: z.array(SubQuestionSchema),
});

export const PaperFormatEnum = z.enum(["IAT", "END_SEM"]);

export const PaperJsonSchema = z.object({
  format: PaperFormatEnum,
  subject: z.string(),
  course_code: z.string().optional(),
  institute_name: z.string().optional(),
  exam_title: z.string(),
  duration_minutes: z.number().int().positive(),
  total_attemptable_marks: z.number().int().positive(),
  total_authored_marks: z.number().int().positive(),
  general_instructions: z.array(z.string()),
  questions: z.array(QuestionSchema),
});

export type BloomLevel = z.infer<typeof BloomLevelSchema>;
export type SubQuestion = z.infer<typeof SubQuestionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type PaperFormat = z.infer<typeof PaperFormatEnum>;
export type PaperJson = z.infer<typeof PaperJsonSchema>;

export const GeneratePaperParamsSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, "Select at least one document"),
  format: PaperFormatEnum,
  subject: z.string().min(1, "Subject is required"),
  courseCode: z.string().optional(),
  instituteName: z.string().optional(),
  examTitle: z.string().optional(),
  difficulty: z.enum(["balanced", "easy", "rigorous"]).default("balanced"),
  focusUnits: z.array(z.string()).optional(),
});

export type GeneratePaperParams = z.infer<typeof GeneratePaperParamsSchema>;

