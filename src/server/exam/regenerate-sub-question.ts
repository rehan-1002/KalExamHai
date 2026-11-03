import "server-only";
import { executeWithGeminiPool } from "../gemini/client";
import { getAdminClient } from "../supabase/admin";
import { retrieveChunks } from "../rag/retrieve";
import { buildContextFromChunks } from "../rag/context-builder";
import { sanitizeLatex } from "./sanitize-latex";
import { SubQuestionSchema, type PaperJson, type SubQuestion } from "@/lib/schemas/paper";

export interface RegenerateSubQuestionResult {
  ok: boolean;
  subQuestion?: SubQuestion;
  updatedPaper?: PaperJson;
  error?: string;
}

/**
 * Regenerates a single sub-question (e.g. Q2b) using RAG chunks without modifying marks or other questions.
 * Sub-question re-roll is FREE (0 credits).
 */
export async function regenerateSubQuestion(
  paperId: string,
  questionNo: number,
  subQuestionId: string,
  ownerId: string
): Promise<RegenerateSubQuestionResult> {
  const supabase = getAdminClient();

  // 1. Fetch existing paper
  const { data: record, error: fetchErr } = await supabase
    .from("generated_papers")
    .select("*")
    .eq("id", paperId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchErr || !record) {
    return { ok: false, error: "Paper not found." };
  }

  const paper = record.paper as PaperJson;
  const question = paper.questions.find((q) => q.no === questionNo);
  if (!question) {
    return { ok: false, error: `Question ${questionNo} not found in paper.` };
  }

  const subQuestion = question.sub_questions.find((sq) => sq.id === subQuestionId);
  if (!subQuestion) {
    return { ok: false, error: `Sub-question ${subQuestionId} not found in Question ${questionNo}.` };
  }

  // 2. Retrieve chunks from document_ids
  const chunks = await retrieveChunks({
    documentIds: record.document_ids,
    ownerId,
    matchCount: 15,
  });

  const { contextText } = buildContextFromChunks(chunks);

  const prompt = `You are an expert exam question setter for Mumbai University.
Provide ONE alternative sub-question for Question ${questionNo}(${subQuestion.label}).
Current question: "${subQuestion.text}"
Marks allocation: ${subQuestion.marks} Marks.

RULES:
1. USE ONLY the knowledge chunks provided below.
2. Must be worth exactly ${subQuestion.marks} marks.
3. Include standard LaTeX delimiters for all math ($...$ for inline, $$...$$ for display).
4. Return ONLY a single JSON object matching this schema:
{
  "id": "${subQuestion.id}",
  "label": "${subQuestion.label}",
  "text": "new question text here",
  "marks": ${subQuestion.marks},
  "source_chunk_ids": ["c_001"],
  "unit_label": "${subQuestion.unit_label || "General"}"
}

CHUNKS:
${contextText}`;

  const response = await executeWithGeminiPool(
    (client) =>
      client.models.generateContent({
        model: process.env.GEMINI_MODEL_GENERATION || "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      }),
    { label: "Gemini SubQuestion Reroll" }
  );

  const cleanJson = (response.text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```$/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    return { ok: false, error: "Model output was not valid JSON." };
  }

  // Defensive unnesting
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.sub_question && typeof obj.sub_question === "object") {
      parsed = obj.sub_question;
    } else if (obj.question && typeof obj.question === "object") {
      parsed = obj.question;
    } else if (obj.data && typeof obj.data === "object") {
      parsed = obj.data;
    }
  }

  // Ensure immutable question identity
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    obj.id = subQuestion.id;
    obj.label = subQuestion.label;
    obj.marks = subQuestion.marks;
  }

  const parsedSub = SubQuestionSchema.safeParse(parsed);
  if (!parsedSub.success) {
    return { ok: false, error: "Generated sub-question did not match schema." };
  }

  const sanitized = sanitizeLatex(parsedSub.data.text);
  const newSubQuestion: SubQuestion = {
    ...parsedSub.data,
    text: sanitized.text,
    marks: subQuestion.marks, // Immutable marks
  };

  // Replace sub-question in paper object
  const updatedQuestions = paper.questions.map((q) => {
    if (q.no !== questionNo) return q;
    return {
      ...q,
      sub_questions: q.sub_questions.map((sq) =>
        sq.id === subQuestionId ? newSubQuestion : sq
      ),
    };
  });

  const updatedPaper: PaperJson = {
    ...paper,
    questions: updatedQuestions,
  };

  // Update in database
  await supabase
    .from("generated_papers")
    .update({ paper: updatedPaper, updated_at: new Date().toISOString() })
    .eq("id", paperId);

  return {
    ok: true,
    subQuestion: newSubQuestion,
    updatedPaper,
  };
}

