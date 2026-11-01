"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { regenerateSubQuestion } from "@/server/exam/regenerate-sub-question";
import { sanitizeLatex } from "@/server/exam/sanitize-latex";
import type { PaperJson } from "@/lib/schemas/paper";

export async function regenerateSubQuestionAction(
  paperId: string,
  questionNo: number,
  subQuestionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  return await regenerateSubQuestion(paperId, questionNo, subQuestionId, user.id);
}

export async function updateSubQuestionTextAction(
  paperId: string,
  questionNo: number,
  subQuestionId: string,
  newText: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const adminClient = getAdminClient();
  const { data: record, error } = await adminClient
    .from("generated_papers")
    .select("paper")
    .eq("id", paperId)
    .eq("owner_id", user.id)
    .single();

  if (error || !record) {
    return { ok: false as const, error: "Paper not found." };
  }

  const paper = record.paper as PaperJson;
  const sanitized = sanitizeLatex(newText);

  // Update text only; marks remain strictly immutable
  const updatedQuestions = paper.questions.map((q) => {
    if (q.no !== questionNo) return q;
    return {
      ...q,
      sub_questions: q.sub_questions.map((sq) => {
        if (sq.id !== subQuestionId) return sq;
        return {
          ...sq,
          text: sanitized.text,
        };
      }),
    };
  });

  const updatedPaper: PaperJson = {
    ...paper,
    questions: updatedQuestions,
  };

  const { error: updateErr } = await adminClient
    .from("generated_papers")
    .update({ paper: updatedPaper, updated_at: new Date().toISOString() })
    .eq("id", paperId);

  if (updateErr) {
    return { ok: false as const, error: updateErr.message };
  }

  return { ok: true as const, updatedPaper };
}

export async function deletePaperAction(paperId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("generated_papers")
    .delete()
    .eq("id", paperId)
    .eq("owner_id", user.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
