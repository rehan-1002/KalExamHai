import "server-only";

import { executeWithGeminiPool } from "@/server/gemini/client";
import { getAdminClient } from "@/server/supabase/admin";
import { retrieveChunks } from "@/server/rag/retrieve";
import { buildContextFromChunks } from "@/server/rag/context-builder";
import { sanitizeLatex } from "@/server/exam/sanitize-latex";
import {
  CramArtifactPayloadSchema,
  type CramArtifactType,
  type CramArtifactPayload,
} from "@/lib/schemas/cram";

interface GenerateCramParams {
  documentIds: string[];
  artifactType: CramArtifactType;
  ownerId: string;
  subject?: string;
  title?: string;
}

export type GenerateCramResult =
  | { ok: true; artifactId: string; payload: CramArtifactPayload }
  | { ok: false; error: string };

export async function generateCramArtifact(
  params: GenerateCramParams
): Promise<GenerateCramResult> {
  const { documentIds, artifactType, ownerId } = params;

  if (!documentIds.length) {
    return { ok: false, error: "Please select at least one syllabus document." };
  }

  // 0. Check Daily Free Quota & 1-Trial Limits
  const { checkCanGenerate } = await import("../credits/daily-quota");
  const quotaCheck = await checkCanGenerate(ownerId, artifactType);
  if (!quotaCheck.allowed) {
    return {
      ok: false,
      error: quotaCheck.reason || "Daily free generation limit reached.",
    };
  }

  // 1. Retrieve knowledge chunks
  const chunks = await retrieveChunks({
    documentIds,
    ownerId,
    matchCount: 12,
  });

  if (!chunks.length) {
    return {
      ok: false,
      error: "No knowledge chunks found in the selected documents. Please upload notes first.",
    };
  }

  const { contextText } = buildContextFromChunks(chunks);

  // 2. Determine subject / title
  const adminClient = getAdminClient();
  const { data: docData } = await adminClient
    .from("documents")
    .select("title, subject")
    .in("id", documentIds)
    .limit(1)
    .maybeSingle();

  const detectedSubject = params.subject?.trim() || docData?.subject || docData?.title || "Exam Subject";
  const defaultTitle =
    params.title?.trim() ||
    (artifactType === "flashcards"
      ? `${detectedSubject} — 3D Holo Flashcards`
      : artifactType === "quick_notes"
      ? `${detectedSubject} — High-Yield Formula Notes`
      : artifactType === "viva_prep"
      ? `${detectedSubject} — Examiner Viva Prep & Traps`
      : `${detectedSubject} — Last-Minute Survival Kit`);

  // 3. Build AI prompt according to artifact type
  let promptInstructions = "";
  if (artifactType === "flashcards") {
    promptInstructions = `Generate a set of 10 to 15 high-yield 3D Flashcards for quick active recall in the final hours before an exam.
Format strictly as JSON matching this schema:
{
  "type": "flashcards",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "cards": [
    {
      "id": "card_1",
      "front": "Clear, concise prompt, question, or law with LaTeX formulas ($...$ for inline, $$...$$ for display).",
      "back": "Punchy, complete answer, derivation step, or diagram breakdown with LaTeX math.",
      "category": "e.g. Formula, Definition, Algorithm, Comparison, Derivation",
      "importance": "must_know" | "high_yield" | "bonus",
      "hint": "Optional quick mental cue"
    }
  ]
}
RULES:
1. Cover the most repeated, high-probability exam concepts from the text.
2. Put mathematical expressions in standard LaTeX ($...$).
3. Keep answers high-density (no useless words).`;
  } else if (artifactType === "quick_notes") {
    promptInstructions = `Generate a high-density, no-fluff Quick Notes and Formula Revision Sheet for an engineering exam.
Format strictly as JSON matching this schema:
{
  "type": "quick_notes",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "high_yield_summary": "Crisp 2-3 paragraph overview of the highest-weightage topics.",
  "core_definitions": [
    { "term": "Term Name", "definition": "Precise textbook definition", "formula": "$...$ if applicable" }
  ],
  "formulas_and_derivations": [
    {
      "title": "Formula Name",
      "formula_latex": "$$...$$",
      "explanation": "What this equation represents and when to use it in numericals",
      "variables": ["$x$ = variable 1", "$y$ = variable 2"]
    }
  ],
  "step_by_step_algorithms": [
    { "title": "Algorithm or Process Name", "steps": ["Step 1...", "Step 2..."] }
  ],
  "exam_hall_traps": ["Common student mistake 1", "Tricky sign convention error 2"]
}
RULES:
1. Strict LaTeX notation ($...$ and $$...$$).
2. Pure signal, zero filler.`;
  } else if (artifactType === "viva_prep") {
    promptInstructions = `Generate an Examiner Viva Examination Prep Sheet categorized into Easy, Medium, and Tricky/Trap questions.
Format strictly as JSON matching this schema:
{
  "type": "viva_prep",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "overview": "Brief guide on how examiners evaluate viva answers in this subject.",
  "questions": [
    {
      "id": "viva_1",
      "difficulty": "easy" | "medium" | "tricky",
      "question": "Question text with LaTeX ($...$)",
      "expected_answer": "Concise answer the student must say out loud.",
      "examiner_trap": "What the professor is secretly trying to test or trip you on",
      "follow_up_defense": "Counter-answer if the professor asks 'Are you sure? What if...'"
    }
  ]
}
RULES:
1. Include at least 4 Easy, 4 Medium, and 4 Tricky questions.
2. The 'examiner_trap' must give students real unfair professor gotchas.`;
  } else {
    promptInstructions = `Generate a Last-Minute Survival Kit for a student with only 12 to 24 hours left before the exam.
Format strictly as JSON matching this schema:
{
  "type": "survival_kit",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "panic_timeline_roadmap": [
    {
      "window": "Hours 1 to 4: Core Definitions & High-Yield Derivations",
      "action": "Immediate memorization priority",
      "target_topics": ["Topic 1", "Topic 2"]
    },
    {
      "window": "Hours 5 to 8: Guaranteed Numerical Steps",
      "action": "Solve standard solved problems",
      "target_topics": ["Topic 3"]
    },
    {
      "window": "Final 2 Hours: Quick Formula Review",
      "action": "Glance over formula sheet, sleep at least 4 hours",
      "target_topics": ["Formulas"]
    }
  ],
  "priority_topics": [
    {
      "title": "Highest Probability Topic",
      "module_name": "Module 1",
      "importance_rank": 1,
      "expected_marks": 10,
      "summary_points": ["Point 1", "Point 2"],
      "must_draw_diagram": "Description of diagram to draw to get 4+ marks"
    }
  ],
  "pass_guarantee_checklist": [
    "Memorize definition of...",
    "Draw the block diagram of...",
    "Write the algorithm for..."
  ]
}`;
  }

  const systemPrompt = `You are the lead engineering examination specialist for Mumbai University.
Extract directly from the syllabus context below. Ground all facts strictly in the provided text.
Return ONLY valid JSON with no markdown wrapping.

CONTEXT:
${contextText}`;

  const model = process.env.GEMINI_MODEL_GENERATION || "gemini-3.5-flash";

  try {
    const response = await executeWithGeminiPool(
      (client) =>
        client.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${promptInstructions}` }],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      { label: "Gemini Cram Generation" }
    );

    const rawText = (response.text || "").trim();
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      return { ok: false, error: "AI response was not valid JSON." };
    }

    // Defensive unnesting: if Gemini wrapped the object
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
        parsed = obj.data;
      } else if (obj.artifact && typeof obj.artifact === "object" && !Array.isArray(obj.artifact)) {
        parsed = obj.artifact;
      }
    }

    // Force-inject known parameters and enforce correct type
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      obj.type = artifactType;
      if (!obj.title || typeof obj.title !== "string" || !obj.title.trim()) {
        obj.title = defaultTitle;
      }
      if (!obj.subject || typeof obj.subject !== "string" || !obj.subject.trim()) {
        obj.subject = detectedSubject;
      }

      // If flashcards, ensure cards array exists and has IDs
      if (artifactType === "flashcards") {
        if (!Array.isArray(obj.cards)) {
          if (Array.isArray(obj.flashcards)) obj.cards = obj.flashcards;
          else obj.cards = [];
        }
        if (Array.isArray(obj.cards)) {
          obj.cards = (obj.cards as Array<Record<string, unknown>>).map((c, idx) => ({
            ...c,
            id: c.id ? String(c.id) : `card_${idx + 1}`,
          }));
        }
      }
      // If viva_prep, ensure questions array exists and has IDs
      if (artifactType === "viva_prep") {
        if (!Array.isArray(obj.questions)) {
          if (Array.isArray(obj.viva_questions)) obj.questions = obj.viva_questions;
          else obj.questions = [];
        }
        if (Array.isArray(obj.questions)) {
          obj.questions = (obj.questions as Array<Record<string, unknown>>).map((q, idx) => ({
            ...q,
            id: q.id ? String(q.id) : `viva_${idx + 1}`,
          }));
        }
      }
      // If survival_kit, ensure lists exist
      if (artifactType === "survival_kit") {
        if (!Array.isArray(obj.priority_topics) && Array.isArray(obj.topics)) {
          obj.priority_topics = obj.topics;
        }
      }
    }

    // Validate payload against schema
    const parseResult = CramArtifactPayloadSchema.safeParse(parsed);
    if (!parseResult.success) {
      console.error("Cram validation issues:", parseResult.error.issues);
      return {
        ok: false,
        error: `Artifact validation failed: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    const payload = parseResult.data;

    // 4. Save to `public.cram_artifacts`
    const { data: record, error: insertErr } = await adminClient
      .from("cram_artifacts")
      .insert({
        owner_id: ownerId,
        document_ids: documentIds,
        artifact_type: artifactType,
        title: payload.title,
        subject: payload.subject,
        content: payload,
        model,
      })
      .select("id")
      .single();

    if (insertErr || !record) {
      return { ok: false, error: `Database error saving artifact: ${insertErr?.message}` };
    }

    return {
      ok: true,
      artifactId: record.id,
      payload,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate study artifact.",
    };
  }
}

