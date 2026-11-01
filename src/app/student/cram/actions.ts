"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { generateCramArtifact } from "@/server/cram/generate-cram-artifact";
import type { CramArtifactType } from "@/lib/schemas/cram";

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

