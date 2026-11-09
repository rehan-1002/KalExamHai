import "server-only";

import { executeWithGeminiPool, getGenerationModel, formatGeminiErrorMessage } from "@/server/gemini/client";
import { getAdminClient } from "@/server/supabase/admin";
import { retrieveChunks } from "@/server/rag/retrieve";
import { buildContextFromChunks } from "@/server/rag/context-builder";
import { sanitizeLatex } from "@/server/exam/sanitize-latex";
import {
  CramArtifactPayloadSchema,
  type CramArtifactType,
  type CramArtifactPayload,
} from "@/lib/schemas/cram";
import { cramCoalescer } from "../coalesce/single-flight";
import { safeJsonParse } from "../utils/safe-json";

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
  const { documentIds = [], artifactType, ownerId } = params;

  const isMuOfficial =
    documentIds.length === 0 ||
    documentIds.some((id) => id.startsWith("mu:"));

  if (!documentIds.length && !params.subject?.trim()) {
    return { ok: false, error: "Please select an official MU subject or upload a syllabus document." };
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

  // 1. Retrieve knowledge chunks (Official MU Syllabus or User RAG documents)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chunks: any[] = [];
  let detectedSubject = params.subject?.trim() || "";

  if (isMuOfficial && (params.subject || params.title)) {
    try {
      const { findSubject } = await import("@/data/mu-syllabus");
      const found = await findSubject(params.subject || params.title || "");
      if (found) {
        detectedSubject = found.subject.name;
        chunks = found.subject.modules.map((m) => ({
          id: `c_${m.moduleNo}`,
          documentId: `mu_${found.subject.code}`,
          documentTitle: `${found.subject.name} (Official MU NEP-2020)`,
          chunkIndex: m.moduleNo,
          unitLabel: `Module ${m.moduleNo}: ${m.title}`,
          pageStart: 1,
          pageEnd: 1,
          content: `[Module ${m.moduleNo}: ${m.title}] (Expected Marks: ~${m.weightageMarks}M)\n` +
            m.topics.map((t) => `• ${t}`).join("\n"),
          tokenCount: 80,
        }));

        try {
          const { findMuQuestionPapers } = await import("@/data/mu-pyqs");
          const pyqs = await findMuQuestionPapers(found.branch.id, found.subject.semester, found.subject.name);
          const pyqArchive = pyqs.slice(0, 8).map((p) => `${p.year} ${p.session} (${p.scheme})`).join(", ");
          chunks.push({
            id: "c_pyq",
            documentId: `mu_pyq_${found.subject.code}`,
            documentTitle: `${found.subject.name} (Historical MU PYQ Archive)`,
            chunkIndex: 99,
            unitLabel: "PYQ Repeat Intelligence",
            pageStart: 1,
            pageEnd: 1,
            content: `[MUMBAI UNIVERSITY HISTORICAL EXAM INTELLIGENCE: ${found.subject.name}]\n` +
              `Archived Past Papers: ${pyqArchive || "Dec '24 NEP, May '24, Dec '23, May '23, Dec '22, May '22"}\n\n` +
              `CRITICAL STUDY ARTIFACT INSTRUCTION:\n` +
              `You MUST focus strictly on concepts, definitions, derivations, and formulas required to answer the MOST FREQUENTLY REPEATED Mumbai University past exam questions.\n` +
              `Give highest priority to topics recurring across May and December exam sessions with 85%+ repeat probability.`,
            tokenCount: 150,
          });
        } catch {
          // fallback
        }
      }
    } catch {
      // Continue to RAG fallback
    }
  }

  if (chunks.length === 0 && documentIds.length > 0) {
    chunks = await retrieveChunks({
      documentIds,
      ownerId,
      matchCount: 8,
    });
  }

  if (!chunks.length && documentIds.length > 0) {
    // Fallback: Check if document exists so students are never blocked by empty vector chunks
    const adminClient = getAdminClient();
    const { data: fallbackDoc } = await adminClient
      .from("documents")
      .select("id, title, subject")
      .in("id", documentIds)
      .limit(1)
      .maybeSingle();

    if (fallbackDoc) {
      chunks = [
        {
          id: fallbackDoc.id,
          documentId: fallbackDoc.id,
          documentTitle: fallbackDoc.title || "Syllabus Notes",
          chunkIndex: 0,
          unitLabel: "General",
          pageStart: 1,
          pageEnd: 1,
          content: `Subject: ${fallbackDoc.subject || fallbackDoc.title}\nSyllabus Outline: ${fallbackDoc.title}`,
          tokenCount: 50,
        },
      ];
    }
  }

  if (!chunks.length) {
    return {
      ok: false,
      error: "No syllabus material found. Please select an official MU subject or upload valid notes.",
    };
  }

  const { contextText } = buildContextFromChunks(chunks);

  // 2. Determine subject / title
  const adminClient = getAdminClient();
  if (!detectedSubject && documentIds.length > 0) {
    const { data: docData } = await adminClient
      .from("documents")
      .select("title, subject")
      .in("id", documentIds)
      .limit(1)
      .maybeSingle();
    detectedSubject = docData?.subject || docData?.title || "Exam Subject";
  }
  if (!detectedSubject) {
    detectedSubject = "Exam Subject";
  }
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
MANDATORY: Focus strictly on the MOST FREQUENTLY REPEATED definitions, laws, algorithms, and concepts from Mumbai University past examination papers.
On the front of each card, append an estimated repeat badge (e.g. "What are Pipeline Hazards? [Repeated 5x in MU • ~92% Probability]").
Format strictly as JSON matching this schema:
{
  "type": "flashcards",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "cards": [
    {
      "id": "card_1",
      "front": "Prompt with MU Repeat badge, e.g. 'State Cayley-Hamilton Theorem & formula for A^-1 [Repeated 5x in MU • ~94% Probability]' ($...$ for math).",
      "back": "Punchy, complete answer, derivation step, or keyword definition with LaTeX math.",
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
MANDATORY: Focus specifically on formulas, derivations, and procedures required to solve the MOST FREQUENTLY REPEATED NUMERICALS in Mumbai University past papers (e.g. Cache EAT, Booth's multiplication, Cayley-Hamilton, Simplex LPP, Fourier coefficients).
Format strictly as JSON matching this schema:
{
  "type": "quick_notes",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "high_yield_summary": "Crisp overview of the highest-weightage topics and their repeat patterns in MU exams.",
  "core_definitions": [
    { "term": "Term Name [Repeated 4x in MU]", "definition": "Precise textbook definition with evaluators' mandatory keywords", "formula": "$...$ if applicable" }
  ],
  "formulas_and_derivations": [
    {
      "title": "Formula Name [~90% Repeat Probability]",
      "formula_latex": "$$...$$",
      "explanation": "What this equation represents and how to apply it in standard MU numericals",
      "variables": ["$x$ = variable 1", "$y$ = variable 2"]
    }
  ],
  "step_by_step_algorithms": [
    { "title": "Algorithm or Process Name (e.g. Booth's Algorithm [Repeated 6x in MU])", "steps": ["Step 1...", "Step 2..."] }
  ],
  "exam_hall_traps": ["Common student mistake 1", "Tricky sign convention error 2"]
}
RULES:
1. Strict LaTeX notation ($...$ and $$...$$).
2. Pure signal, zero filler.`;
  } else if (artifactType === "viva_prep") {
    promptInstructions = `Generate an Examiner Viva Examination Prep Sheet categorized into Easy, Medium, and Tricky/Trap questions based on frequent oral exam traps in Mumbai University.
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
  } else if (artifactType === "kt_buster") {
    promptInstructions = `Generate the official Mumbai University "KT Buster (24-Mark Minimum Passing Strategy)" for ${detectedSubject}.
CONTEXT: The student needs exactly 24 marks out of 60 to pass the End-Semester Examination. Trying to cover all 6 modules causes anxiety and failure.
Your job is to construct a surgical passing blueprint targeting 32 marks (giving an 8-mark safe cushion).

MANDATORY MUMBAI UNIVERSITY NEP-2020 RULES:
- Mumbai University NEP-2020 NEVER has single 10-mark standalone essay questions.
- All question parts are strictly 5 Marks, 6 Marks, or 4 Marks (e.g., 6M + 4M = 10M, or 5M + 5M = 10M).
- Select exactly 2 "Golden Modules" (modules with the highest predictable weightage and easiest scoring potential).
- Identify 6 Fixed Repeating PYQs that recur repeatedly in MU exams across May and Dec sessions.
- Provide clear 3-part step marking breakdowns for every question (e.g. "Step 1: Definition & Formula (1-2M)", "Step 2: Circuit / Block Diagram (2M)", "Step 3: Derivation / Steps (2M)").
- Identify 3 "Must-Draw High-Value Diagrams" that examiners look for to award instant passing marks.
- Build a prioritized Pass Checklist with assigned marks totaling ~32 marks.

Format strictly as JSON matching this schema:
{
  "type": "kt_buster",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "passing_threshold": 24,
  "target_safe_marks": 32,
  "study_time_hours": 5,
  "golden_modules": [
    {
      "module_no": 1,
      "module_title": "Module Title",
      "weightage_marks": 12,
      "why_easy": "Why this module is the fastest to master with predictable exam questions"
    },
    {
      "module_no": 4,
      "module_title": "Module Title",
      "weightage_marks": 14,
      "why_easy": "Predictable numericals / standard derivations that appear every year"
    }
  ],
  "fixed_repeating_questions": [
    {
      "id": "q1",
      "question_text": "Exact question text with LaTeX ($...$)",
      "marks": 5,
      "module_no": 1,
      "repeat_count_mu": 5,
      "repeat_sessions": "Dec 2024 NEP, May 2024, Dec 2023, May 2023",
      "probability_percentage": 92,
      "step_marking_breakdown": [
        "1M: Core definition & governing formula with units",
        "2M: Neatly labeled block diagram or timing diagram",
        "2M: 3-step explanation of working principle"
      ],
      "diagram_required": true,
      "key_answer_bullets": [
        "Mandatory bullet 1 with evaluator keyword",
        "Mandatory bullet 2 with key formula"
      ]
    }
  ],
  "must_draw_diagrams": [
    {
      "title": "Diagram Name",
      "marks_value": 4,
      "diagram_description": "Precise description of the block diagram / pinout / flowchart that MU evaluators check.",
      "module_no": 1
    }
  ],
  "pass_checklist": [
    {
      "id": "chk_1",
      "task": "Master [Question / Derivation] (Golden Module 1)",
      "marks": 5,
      "is_critical": true,
      "module_no": 1
    }
  ]
}
RULES:
1. Strict LaTeX notation ($...$ and $$...$$).
2. NEVER output 10-mark single questions; every question must be 5M, 6M, or 4M.
3. Total checklist marks must add up to between 28 and 34 marks.`;
  } else {
    promptInstructions = `Generate a Last-Minute Survival Kit for a student with only 12 to 24 hours left before the exam.
MANDATORY: Rank priority topics by MUMBAI UNIVERSITY REPEAT PROBABILITY:
- Tier 1 (Rank 1-3): Guaranteed repeat questions with 85%-95% probability that appeared in 4+ past MU exam sessions.
- Tier 2 (Rank 4-6): High-yield topics with 65%-80% probability that alternate between Summer and Winter sessions.
- Must-Draw Diagrams: Describe the exact labeled block diagrams that MU examiners look for to award passing marks.
Format strictly as JSON matching this schema:
{
  "type": "survival_kit",
  "title": "${defaultTitle}",
  "subject": "${detectedSubject}",
  "panic_timeline_roadmap": [
    {
      "window": "Hours 1 to 4: Tier-1 Guaranteed Repeats (85%-95% Probability)",
      "action": "Immediate memorization priority to secure passing marks",
      "target_topics": ["Topic 1 (Repeated 5x)", "Topic 2 (Repeated 4x)"]
    },
    {
      "window": "Hours 5 to 8: High-Yield Alternates & Standard Numericals",
      "action": "Solve standard solved problems",
      "target_topics": ["Topic 3"]
    },
    {
      "window": "Final 2 Hours: Quick Formula Review & Must-Draw Diagrams",
      "action": "Glance over formula sheet, practice diagrams, sleep at least 4 hours",
      "target_topics": ["Formulas", "Diagrams"]
    }
  ],
  "priority_topics": [
    {
      "title": "Highest Probability Topic [Repeated 5x in MU • ~94% Probability]",
      "module_name": "Module 1",
      "importance_rank": 1,
      "expected_marks": 10,
      "summary_points": ["Key concept point 1", "Key concept point 2"],
      "must_draw_diagram": "Description of diagram to draw to get 4+ marks"
    }
  ],
  "pass_guarantee_checklist": [
    "Master Tier-1 Topic: ... (Secures 10M)",
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

  const model = getGenerationModel();

  const sortedDocs = [...documentIds].sort().join(",");
  const coalesceKey = `cram::${artifactType}::${detectedSubject.toLowerCase()}::${sortedDocs}`;

  try {
    const coalesced = await cramCoalescer.execute(coalesceKey, async () => {
      let candidatePayload: CramArtifactPayload | null = null;
      let lastErrMessage = "";

      // Multi-attempt self-healing loop (up to 2 attempts)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const attemptPrompt = attempt > 1 && lastErrMessage
            ? `${systemPrompt}\n\nCRITICAL FIX: Your previous response failed with "${lastErrMessage}". Format strictly as clean valid JSON with properly escaped LaTeX backslashes ($...$).\n\n${promptInstructions}`
            : `${systemPrompt}\n\n${promptInstructions}`;

          const response = await executeWithGeminiPool(
            (client) =>
              client.models.generateContent({
                model,
                contents: [
                  {
                    role: "user",
                    parts: [{ text: attemptPrompt }],
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
          let parsed: unknown;
          try {
            parsed = safeJsonParse(rawText);
          } catch (jsonErr: unknown) {
            lastErrMessage = jsonErr instanceof Error ? jsonErr.message : "AI response was not valid JSON.";
            continue;
          }

          // Defensive unnesting: if Gemini wrapped the object in { data: ... } or { artifact: ... }
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

            // If flashcards, ensure cards array exists and has robust front/back properties
            if (artifactType === "flashcards") {
              if (!Array.isArray(obj.cards)) {
                if (Array.isArray(obj.flashcards)) obj.cards = obj.flashcards;
                else obj.cards = [];
              }
              if (Array.isArray(obj.cards)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.cards = (obj.cards as any[]).map((c: any, idx: number) => {
                  const frontText =
                    (typeof c?.front === "string" && c.front.trim()) ||
                    (typeof c?.question === "string" && c.question.trim()) ||
                    (typeof c?.prompt === "string" && c.prompt.trim()) ||
                    (typeof c?.term === "string" && c.term.trim()) ||
                    `Core Exam Concept ${idx + 1}`;

                  const backText =
                    (typeof c?.back === "string" && c.back.trim()) ||
                    (typeof c?.answer === "string" && c.answer.trim()) ||
                    (typeof c?.explanation === "string" && c.explanation.trim()) ||
                    (typeof c?.solution === "string" && c.solution.trim()) ||
                    `Detailed examination answer, derivation, and breakdown for Concept ${idx + 1}.`;

                  return {
                    ...c,
                    id: c?.id ? String(c.id) : `card_${idx + 1}`,
                    front: frontText,
                    back: backText,
                    category: typeof c?.category === "string" && c.category.trim() ? c.category.trim() : "General",
                  };
                });
              }
            }

            // If viva_prep, ensure questions array exists and has valid questions & answers
            if (artifactType === "viva_prep") {
              if (!Array.isArray(obj.questions)) {
                if (Array.isArray(obj.viva_questions)) obj.questions = obj.viva_questions;
                else obj.questions = [];
              }
              if (Array.isArray(obj.questions)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.questions = (obj.questions as any[]).map((q: any, idx: number) => ({
                  ...q,
                  id: q?.id ? String(q.id) : `viva_${idx + 1}`,
                  question:
                    (typeof q?.question === "string" && q.question.trim()) ||
                    (typeof q?.text === "string" && q.text.trim()) ||
                    (typeof q?.prompt === "string" && q.prompt.trim()) ||
                    `Viva Question ${idx + 1}`,
                  answer:
                    (typeof q?.answer === "string" && q.answer.trim()) ||
                    (typeof q?.explanation === "string" && q.explanation.trim()) ||
                    `Expected model viva answer for question ${idx + 1}.`,
                }));
              }
            }

            // If quick_notes, ensure core_definitions and formulas exist
            if (artifactType === "quick_notes") {
              if (Array.isArray(obj.core_definitions)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.core_definitions = (obj.core_definitions as any[]).map((d: any, idx: number) => ({
                  ...d,
                  term: (typeof d?.term === "string" && d.term.trim()) || `Term ${idx + 1}`,
                  definition: (typeof d?.definition === "string" && d.definition.trim()) || `Definition for term ${idx + 1}.`,
                }));
              }
              if (Array.isArray(obj.formulas_and_derivations)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.formulas_and_derivations = (obj.formulas_and_derivations as any[]).map((f: any, idx: number) => ({
                  ...f,
                  title: (typeof f?.title === "string" && f.title.trim()) || `Formula ${idx + 1}`,
                }));
              }
            }

            // If survival_kit, ensure lists exist
            if (artifactType === "survival_kit") {
              if (!Array.isArray(obj.priority_topics) && Array.isArray(obj.topics)) {
                obj.priority_topics = obj.topics;
              }
            }

            // If kt_buster, ensure defensive arrays and values
            if (artifactType === "kt_buster") {
              if (!Array.isArray(obj.golden_modules)) {
                obj.golden_modules = [];
              }
              if (!Array.isArray(obj.fixed_repeating_questions)) {
                if (Array.isArray(obj.questions)) obj.fixed_repeating_questions = obj.questions;
                else if (Array.isArray(obj.repeating_questions)) obj.fixed_repeating_questions = obj.repeating_questions;
                else obj.fixed_repeating_questions = [];
              }
              if (!Array.isArray(obj.must_draw_diagrams)) {
                if (Array.isArray(obj.diagrams)) obj.must_draw_diagrams = obj.diagrams;
                else obj.must_draw_diagrams = [];
              }
              if (!Array.isArray(obj.pass_checklist)) {
                if (Array.isArray(obj.checklist)) obj.pass_checklist = obj.checklist;
                else obj.pass_checklist = [];
              }
            }
          }

          // Validate payload against schema
          const parseResult = CramArtifactPayloadSchema.safeParse(parsed);
          if (!parseResult.success) {
            console.error("Cram validation issues:", parseResult.error.issues);
            lastErrMessage = parseResult.error.issues.map((i) => i.message).join(", ");
            continue;
          }

          candidatePayload = parseResult.data;
          break;
        } catch (attemptErr: unknown) {
          lastErrMessage = formatGeminiErrorMessage(attemptErr);
        }
      }

      if (!candidatePayload) {
        throw new Error(lastErrMessage || "Failed to generate study artifact. Please try again.");
      }

      return candidatePayload;
    });

    const payload = JSON.parse(JSON.stringify(coalesced.data)) as CramArtifactPayload;
    if (params.title?.trim()) payload.title = params.title.trim();
    if (params.subject?.trim()) payload.subject = params.subject.trim();

    // 4. Save to `public.cram_artifacts` for this ownerId
    const sanitizedDocIds = (documentIds || []).filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );

    let { data: record, error: insertErr } = await adminClient
      .from("cram_artifacts")
      .insert({
        owner_id: ownerId,
        document_ids: sanitizedDocIds,
        artifact_type: artifactType,
        title: payload.title,
        subject: payload.subject,
        content: payload,
        model,
      })
      .select("id")
      .single();

    // Defensive fallback: If database enum hasn't been migrated yet, store with 'survival_kit'
    if (
      insertErr &&
      typeof insertErr.message === "string" &&
      insertErr.message.toLowerCase().includes("cram_artifact_type") &&
      artifactType === "kt_buster"
    ) {
      const fallbackResult = await adminClient
        .from("cram_artifacts")
        .insert({
          owner_id: ownerId,
          document_ids: sanitizedDocIds,
          artifact_type: "survival_kit",
          title: payload.title,
          subject: payload.subject,
          content: payload,
          model,
        })
        .select("id")
        .single();

      record = fallbackResult.data;
      insertErr = fallbackResult.error;
    }

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
      error: formatGeminiErrorMessage(err),
    };
  }
}

