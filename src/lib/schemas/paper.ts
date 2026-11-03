import { z } from "zod";

const nullableOptionalString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .optional();

export const BloomLevelSchema = z
  .preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const upper = val.toUpperCase().trim();
    if (upper.includes("L1") || upper.includes("REMEMBER")) return "L1_REMEMBER";
    if (upper.includes("L2") || upper.includes("UNDERSTAND")) return "L2_UNDERSTAND";
    if (upper.includes("L3") || upper.includes("APPLY")) return "L3_APPLY";
    if (upper.includes("L4") || upper.includes("ANALYZE")) return "L4_ANALYZE";
    if (upper.includes("L5") || upper.includes("EVALUATE")) return "L5_EVALUATE";
    if (upper.includes("L6") || upper.includes("CREATE")) return "L6_CREATE";
    return undefined;
  }, z.enum([
    "L1_REMEMBER",
    "L2_UNDERSTAND",
    "L3_APPLY",
    "L4_ANALYZE",
    "L5_EVALUATE",
    "L6_CREATE",
  ]).optional())
  .optional();

export const SubQuestionSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  label: z.string().nullish().transform((v) => v || "a"),
  text: z.string().min(1, "Question text is required"),
  marks: z.coerce.number().int().positive(),
  source_chunk_ids: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  unit_label: nullableOptionalString,
  bloom_level: BloomLevelSchema,
  coverage_warning: nullableOptionalString,
});

export const QuestionSchema = z.object({
  no: z.coerce.number().int().positive(),
  title: nullableOptionalString,
  compulsory: z.coerce.boolean().default(false),
  total_marks: z.coerce.number().int().positive(),
  attempt_count: z.coerce.number().int().positive(),
  out_of: z.coerce.number().int().positive(),
  instructions: z.string().nullish().transform((v) => v || "Attempt as instructed."),
  sub_questions: z.array(SubQuestionSchema),
});

export const PaperFormatEnum = z.preprocess((val) => {
  if (typeof val !== "string") return "IAT";
  const upper = val.toUpperCase().trim();
  if (upper.includes("END") || upper.includes("SEM")) return "END_SEM";
  return "IAT";
}, z.enum(["IAT", "END_SEM"]));

export const PaperJsonSchema = z.object({
  format: PaperFormatEnum,
  subject: z.string().min(1, "Subject is required"),
  course_code: nullableOptionalString,
  institute_name: nullableOptionalString,
  exam_title: z.string().default("Examination Question Paper"),
  duration_minutes: z.coerce.number().int().positive().default(60),
  total_attemptable_marks: z.coerce.number().int().positive().default(20),
  total_authored_marks: z.coerce.number().int().positive().default(30),
  general_instructions: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
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
  courseCode: nullableOptionalString,
  instituteName: nullableOptionalString,
  examTitle: nullableOptionalString,
  difficulty: z.enum(["balanced", "easy", "rigorous"]).default("balanced"),
  focusUnits: z.array(z.string()).optional(),
});

export type GeneratePaperParams = z.infer<typeof GeneratePaperParamsSchema>;
