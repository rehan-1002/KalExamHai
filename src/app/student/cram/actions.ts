"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { generateCramArtifact } from "@/server/cram/generate-cram-artifact";
import { isAdminEmail } from "@/lib/auth/admin";
import type { CramArtifactType } from "@/lib/schemas/cram";

// In-memory 45-second pacing map for study artifacts
const lastCramGenMap = new Map<string, number>();

interface GenerateCramActionParams {
  documentIds: string[];
  artifactType: CramArtifactType;
  subject?: string;
  title?: string;
}

export async function generateCramItemAction(params: GenerateCramActionParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "You must be signed in to generate study artifacts." };
  }

  const isAdmin = isAdminEmail(user.email);
  const now = Date.now();
  const lastGen = lastCramGenMap.get(user.id) || 0;
  const elapsed = now - lastGen;
  const COOLDOWN_MS = 45000;

  if (!isAdmin && elapsed < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return {
      ok: false as const,
      error: `Engine cooling down to protect API limits. Please wait ${remaining}s before generating another study artifact.`,
    };
  }

  lastCramGenMap.set(user.id, now);

  const result = await generateCramArtifact({
    documentIds: params.documentIds,
    artifactType: params.artifactType,
    ownerId: user.id,
    subject: params.subject,
    title: params.title,
  });

  if (result.ok) {
    revalidatePath("/student");
    revalidatePath("/student/cram");
    return { ok: true as const, artifactId: result.artifactId };
  }

  return { ok: false as const, error: result.error };
}

export async function deleteCramItemAction(artifactId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("cram_artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("owner_id", user.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/student");
  return { ok: true as const };
}

