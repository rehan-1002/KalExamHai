import { z } from "zod";

const nullableOptionalString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .optional();

/**
 * Robust integer parser that extracts numbers even if Gemini returns
 * "Q1" -> 1, "10 Marks" -> 10, "5M" -> 5, or raw numbers.
 */
export const flexibleInt = (fallback = 1) =>
  z.preprocess((val) => {
    if (typeof val === "number" && !isNaN(val)) return Math.max(1, Math.round(val));
    if (typeof val === "string") {
      const match = val.match(/\d+/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return fallback;
  }, z.number().int().positive());

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

export const QuestionDiagramSchema = z.object({
  type: z.enum(["mermaid", "circuit", "beam", "svg"]).default("mermaid"),
  code: z.string().default(""),
  caption: z.string().default("Figure 1"),
});

export type QuestionDiagram = z.infer<typeof QuestionDiagramSchema>;

export const SubQuestionSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  label: z.string().nullish().transform((v) => v || "a"),
  text: z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : "Explain the concept, step-by-step procedure, and analysis.")),
  marks: flexibleInt(5),
  source_chunk_ids: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  unit_label: nullableOptionalString,
  bloom_level: BloomLevelSchema,
  coverage_warning: nullableOptionalString,
  repeat_badge: nullableOptionalString,
  marking_breakdown: z.array(z.string()).optional(),
  model_answer_hint: nullableOptionalString,
  diagram: z.preprocess((val) => {
    if (!val || typeof val !== "object") return undefined;
    const v = val as Record<string, unknown>;
    const rawCode = v.code || v.svg_code || v.mermaid_code || v.diagram_code || "";
    if (typeof rawCode !== "string" || !rawCode.trim()) return undefined;

    const typeStr = typeof v.type === "string" ? v.type.toLowerCase().trim() : "mermaid";
    let type: "mermaid" | "circuit" | "beam" | "svg" = "mermaid";
    if (typeStr.includes("circuit")) type = "circuit";
    else if (typeStr.includes("beam")) type = "beam";
    else if (typeStr.includes("svg")) type = "svg";

    return {
      type,
      code: rawCode.trim(),
      caption: typeof v.caption === "string" && v.caption.trim() ? v.caption.trim() : "Figure 1",
    };
  }, QuestionDiagramSchema.optional()).optional(),
});

export const QuestionSchema = z.object({
  no: flexibleInt(1),
  title: nullableOptionalString,
  compulsory: z.coerce.boolean().default(false),
  total_marks: flexibleInt(10),
  attempt_count: flexibleInt(1),
  out_of: flexibleInt(1),
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
  duration_minutes: flexibleInt(60),
  total_attemptable_marks: flexibleInt(20),
  total_authored_marks: flexibleInt(30),
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
  documentIds: z.array(z.string()).default([]),
  format: PaperFormatEnum,
  subject: z.string().min(1, "Subject is required"),
  courseCode: nullableOptionalString,
  instituteName: nullableOptionalString,
  examTitle: nullableOptionalString,
  difficulty: z.enum(["balanced", "easy", "rigorous"]).default("balanced"),
  focusUnits: z.array(z.string()).optional(),
  branchId: nullableOptionalString,
  semester: z.number().int().optional(),
  iatTerm: z.enum(["IAT-1", "IAT-2"]).optional(),
});

export type GeneratePaperParams = z.infer<typeof GeneratePaperParamsSchema>;
