"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePaper } from "@/server/exam/generate-paper";
import { GeneratePaperParamsSchema, type GeneratePaperParams } from "@/lib/schemas/paper";

export async function generatePaperAction(rawParams: GeneratePaperParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, code: "UNAUTHORIZED", message: "You must be signed in to generate papers." };
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

  return await generatePaper(parsed.data, user.id);
}
