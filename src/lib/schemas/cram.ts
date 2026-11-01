import { z } from "zod";

// ==========================================
// 1. Flashcards Schema
// ==========================================
export const FlashcardItemSchema = z.object({
  id: z.string(),
  front: z.string().min(1, "Front prompt is required"),
  back: z.string().min(1, "Back answer is required"),
  category: z.string().default("General"),
  importance: z.enum(["must_know", "high_yield", "bonus"]).default("high_yield"),
  hint: z.string().optional(),
});

export const FlashcardsPayloadSchema = z.object({
  type: z.literal("flashcards"),
  title: z.string(),
  subject: z.string(),
  cards: z.array(FlashcardItemSchema).min(3, "At least 3 flashcards required"),
});

// ==========================================
// 2. Quick Notes Schema
// ==========================================
export const DefinitionItemSchema = z.object({
  term: z.string(),
  definition: z.string(),
  formula: z.string().optional(),
});

export const FormulaDerivationItemSchema = z.object({
  title: z.string(),
  formula_latex: z.string(),
  explanation: z.string(),
  variables: z.array(z.string()).default([]),
});

export const QuickNotesPayloadSchema = z.object({
  type: z.literal("quick_notes"),
  title: z.string(),
  subject: z.string(),
  high_yield_summary: z.string(),
  core_definitions: z.array(DefinitionItemSchema),
  formulas_and_derivations: z.array(FormulaDerivationItemSchema),
  step_by_step_algorithms: z.array(
    z.object({
      title: z.string(),
      steps: z.array(z.string()),
    })
  ).default([]),
  exam_hall_traps: z.array(z.string()).default([]),
});

// ==========================================
// 3. Viva Exam Prep Schema
// ==========================================
export const VivaQuestionSchema = z.object({
  id: z.string(),
  difficulty: z.enum(["easy", "medium", "tricky"]),
  question: z.string(),
  expected_answer: z.string(),
  examiner_trap: z.string().optional(), // What the professor is testing
  follow_up_defense: z.string().optional(), // Follow-up answer if pushed
});

export const VivaPrepPayloadSchema = z.object({
  type: z.literal("viva_prep"),
  title: z.string(),
  subject: z.string(),
  overview: z.string(),
  questions: z.array(VivaQuestionSchema).min(3, "At least 3 viva questions required"),
});

// ==========================================
// 4. Last-Minute Survival Kit Schema
// ==========================================
export const SurvivalTopicSchema = z.object({
  title: z.string(),
  module_name: z.string().default("Module 1"),
  importance_rank: z.number().int().positive(),
  expected_marks: z.number().int().positive(),
  summary_points: z.array(z.string()),
  must_draw_diagram: z.string().optional(),
});

export const SurvivalKitPayloadSchema = z.object({
  type: z.literal("survival_kit"),
  title: z.string(),
  subject: z.string(),
  panic_timeline_roadmap: z.array(
    z.object({
      window: z.string(), // e.g. "Hour 1 to 4: High-Yield Theory"
      action: z.string(),
      target_topics: z.array(z.string()),
    })
  ),
  priority_topics: z.array(SurvivalTopicSchema),
  pass_guarantee_checklist: z.array(z.string()),
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

