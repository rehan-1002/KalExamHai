"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePaper } from "@/server/exam/generate-paper";
import { GeneratePaperParamsSchema, type GeneratePaperParams } from "@/lib/schemas/paper";
import { isAdminEmail } from "@/lib/auth/admin";

// In-memory 45-second pacing map: userId -> lastGenerationTimestamp
const lastPaperGenMap = new Map<string, number>();

export async function generatePaperAction(rawParams: GeneratePaperParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, code: "UNAUTHORIZED", message: "You must be signed in to generate papers." };
  }

  const isAdmin = isAdminEmail(user.email);
  const now = Date.now();
  const lastGen = lastPaperGenMap.get(user.id) || 0;
  const elapsed = now - lastGen;
  const COOLDOWN_MS = 45000;

  if (!isAdmin && elapsed < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return {
      ok: false as const,
      code: "RATE_LIMITED",
      message: `Engine cooling down to protect API limits. Please wait ${remaining}s before generating again.`,
    };
  }

  // Validate input
  const parsed = GeneratePaperParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return {
      ok: false as const,
      code: "INVALID_PARAMS",
      message: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  lastPaperGenMap.set(user.id, now);
  const result = await generatePaper(parsed.data, user.id);
  if (!result.ok) {
    lastPaperGenMap.delete(user.id);
  }
  return result;
}
