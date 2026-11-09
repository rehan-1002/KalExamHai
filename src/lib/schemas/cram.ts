import { z } from "zod";

// Defensive helper: converts null, undefined, or empty strings to undefined
const nullableOptionalString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .optional();

// Robust integer parser for rankings and marks
const flexibleInt = (fallback = 1) =>
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
  front: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Core Concept / Formula")),
  back: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Key explanation and step-by-step procedure.")),
  category: z.string().nullish().transform((v) => v || "General"),
  importance: FlashcardImportanceEnum,
  hint: nullableOptionalString,
});

export const FlashcardsPayloadSchema = z.object({
  type: z.literal("flashcards"),
  title: z.string().default("3D Holo Flashcards"),
  subject: z.string().default("Engineering Subject"),
  cards: z.array(FlashcardItemSchema).min(1, "At least one flashcard required"),
});

// ==========================================
// 2. Quick Notes Schema
// ==========================================
export const DefinitionItemSchema = z.object({
  term: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Core Term")),
  definition: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Key textbook definition.")),
  formula: nullableOptionalString,
});

export const FormulaDerivationItemSchema = z.object({
  title: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Key Formula / Derivation")),
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
  importance_rank: flexibleInt(1),
  expected_marks: flexibleInt(5),
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
// 5. KT Buster (24-Mark Minimum Passing Strategy)
// ==========================================
export const GoldenModuleSchema = z.object({
  module_no: flexibleInt(1),
  module_title: z.string().nullish().transform((v) => (v && v.trim() ? v.trim() : "Module 1")),
  weightage_marks: flexibleInt(12),
  why_easy: z.string().default("High marks-to-effort ratio with predictable examination questions."),
});

export const KtRepeatingQuestionSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  question_text: z.string().min(1, "Question text required"),
  marks: flexibleInt(5), // Strictly 5M or 6M in MU NEP-2020 format
  module_no: flexibleInt(1),
  repeat_count_mu: flexibleInt(3),
  repeat_sessions: z.string().default("Dec 2023, May 2024"),
  probability_percentage: flexibleInt(85),
  step_marking_breakdown: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  diagram_required: z.boolean().default(false),
  key_answer_bullets: z
    .array(z.string())
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
});

export const MustDrawDiagramSchema = z.object({
  title: z.string().min(1, "Diagram title required"),
  marks_value: flexibleInt(4),
  diagram_description: z.string().default(""),
  module_no: flexibleInt(1),
});

export const KtPassChecklistItemSchema = z.object({
  id: z.string().nullish().transform((v) => v || crypto.randomUUID()),
  task: z.string().min(1, "Checklist task required"),
  marks: flexibleInt(5),
  is_critical: z.boolean().default(true),
  module_no: flexibleInt(1).optional(),
});

export const KtBusterPayloadSchema = z.object({
  type: z.literal("kt_buster"),
  title: z.string().default("KT Buster: 24-Mark Pass Strategy"),
  subject: z.string().default("Engineering Subject"),
  passing_threshold: flexibleInt(24),
  target_safe_marks: flexibleInt(32),
  study_time_hours: flexibleInt(5),
  golden_modules: z
    .array(GoldenModuleSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  fixed_repeating_questions: z
    .array(KtRepeatingQuestionSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  must_draw_diagrams: z
    .array(MustDrawDiagramSchema)
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : [])),
  pass_checklist: z
    .array(KtPassChecklistItemSchema)
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
  KtBusterPayloadSchema,
]);

export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;
export type FlashcardsPayload = z.infer<typeof FlashcardsPayloadSchema>;
export type QuickNotesPayload = z.infer<typeof QuickNotesPayloadSchema>;
export type VivaQuestion = z.infer<typeof VivaQuestionSchema>;
export type VivaPrepPayload = z.infer<typeof VivaPrepPayloadSchema>;
export type SurvivalTopic = z.infer<typeof SurvivalTopicSchema>;
export type SurvivalKitPayload = z.infer<typeof SurvivalKitPayloadSchema>;
export type GoldenModule = z.infer<typeof GoldenModuleSchema>;
export type KtRepeatingQuestion = z.infer<typeof KtRepeatingQuestionSchema>;
export type MustDrawDiagram = z.infer<typeof MustDrawDiagramSchema>;
export type KtPassChecklistItem = z.infer<typeof KtPassChecklistItemSchema>;
export type KtBusterPayload = z.infer<typeof KtBusterPayloadSchema>;
export type CramArtifactPayload = z.infer<typeof CramArtifactPayloadSchema>;
export type CramArtifactType = "flashcards" | "quick_notes" | "viva_prep" | "survival_kit" | "kt_buster";
