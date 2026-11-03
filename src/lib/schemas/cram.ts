import { z } from "zod";

// Defensive helper: converts null, undefined, or empty strings to undefined
const nullableOptionalString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .optional();

// Case-tolerant Flashcard Importance
const FlashcardImportanceEnum = z.preprocess((val) => {
  if (typeof val !== "string") return "high_yield";
  const lower = val.toLowerCase().replace(/[^a-z_]/g, "");
  if (lower.includes("must")) return "must_know";
  if (lower.includes("bonus")) return "bonus";
  return "high_yield";
}, z.enum(["must_know", "high_yield", "bonus"]).default("high_yield"));

// Case-tolerant Viva Difficulty
const VivaDifficultyEnum = z.preprocess((val) => {
  if (typeof val !== "string") return "medium";
  const lower = val.toLowerCase().trim();
  if (lower.includes("easy")) return "easy";
  if (lower.includes("trick") || lower.includes("hard")) return "tricky";
  return "medium";
}, z.enum(["easy", "medium", "tricky"]).default("medium"));

// ==========================================
// 1. Flashcards Schema
// ==========================================
export const FlashcardItemSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  front: z.string().min(1, "Front prompt is required"),
  back: z.string().min(1, "Back answer is required"),
  category: z.string().nullish().transform((v) => v || "General"),
  importance: FlashcardImportanceEnum,
  hint: nullableOptionalString,
});

export const FlashcardsPayloadSchema = z.object({
  type: z.literal("flashcards"),
  title: z.string(),
  subject: z.string(),
  cards: z.array(FlashcardItemSchema).min(1, "At least one flashcard required"),
});

// ==========================================
// 2. Quick Notes Schema
// ==========================================
export const DefinitionItemSchema = z.object({
  term: z.string().min(1, "Term is required"),
  definition: z.string().min(1, "Definition is required"),
  formula: nullableOptionalString,
});

export const FormulaDerivationItemSchema = z.object({
  title: z.string().min(1, "Formula title is required"),
  formula_latex: z.string().default(""),
  explanation: z.string().default(""),
  variables: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
});

export const QuickNotesPayloadSchema = z.object({
  type: z.literal("quick_notes"),
  title: z.string(),
  subject: z.string(),
  high_yield_summary: z.string().default("High-Yield Summary"),
  core_definitions: z
    .array(DefinitionItemSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  formulas_and_derivations: z
    .array(FormulaDerivationItemSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  step_by_step_algorithms: z
    .array(
      z.object({
        title: z.string(),
        steps: z.array(z.string()),
      })
    )
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  exam_hall_traps: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
});

// ==========================================
// 3. Viva Exam Prep Schema
// ==========================================
export const VivaQuestionSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  difficulty: VivaDifficultyEnum,
  question: z.string().min(1, "Question is required"),
  expected_answer: z.string().min(1, "Answer is required"),
  examiner_trap: nullableOptionalString,
  follow_up_defense: nullableOptionalString,
});

export const VivaPrepPayloadSchema = z.object({
  type: z.literal("viva_prep"),
  title: z.string(),
  subject: z.string(),
  overview: z.string().default("Examiner Viva Preparation Guide"),
  questions: z.array(VivaQuestionSchema).min(1, "At least one question required"),
});

// ==========================================
// 4. Last-Minute Survival Kit Schema
// ==========================================
export const SurvivalTopicSchema = z.object({
  title: z.string().min(1, "Topic title is required"),
  module_name: z.string().nullish().transform((v) => v || "Module 1"),
  importance_rank: z.coerce.number().int().positive().default(1),
  expected_marks: z.coerce.number().int().positive().default(5),
  summary_points: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  must_draw_diagram: nullableOptionalString,
});

export const SurvivalKitPayloadSchema = z.object({
  type: z.literal("survival_kit"),
  title: z.string(),
  subject: z.string(),
  panic_timeline_roadmap: z
    .array(
      z.object({
        window: z.string(),
        action: z.string(),
        target_topics: z
          .array(z.string())
          .nullish()
          .transform((v) => (Array.isArray(v) ? v : [])),
      })
    )
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  priority_topics: z
    .array(SurvivalTopicSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  pass_guarantee_checklist: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
});

// ==========================================
// Discriminated Cram Artifact
// ==========================================
export const CramArtifactPayloadSchema = z.discriminatedUnion("type", [
  FlashcardsPayloadSchema,
  QuickNotesPayloadSchema,
  VivaPrepPayloadSchema,
  SurvivalKitPayloadSchema,
]);

export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;
export type FlashcardsPayload = z.infer<typeof FlashcardsPayloadSchema>;
export type QuickNotesPayload = z.infer<typeof QuickNotesPayloadSchema>;
export type VivaQuestion = z.infer<typeof VivaQuestionSchema>;
export type VivaPrepPayload = z.infer<typeof VivaPrepPayloadSchema>;
export type SurvivalTopic = z.infer<typeof SurvivalTopicSchema>;
export type SurvivalKitPayload = z.infer<typeof SurvivalKitPayloadSchema>;
export type CramArtifactPayload = z.infer<typeof CramArtifactPayloadSchema>;
export type CramArtifactType = "flashcards" | "quick_notes" | "viva_prep" | "survival_kit";
