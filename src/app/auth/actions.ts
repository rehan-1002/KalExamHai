"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/admin";
import { getAdminClient } from "@/server/supabase/admin";

export async function grantCreditsAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }

  const targetEmail = (formData.get("targetEmail") as string)?.trim().toLowerCase();
  const amount = parseInt(formData.get("amount") as string, 10);

  if (!targetEmail || isNaN(amount) || amount <= 0) {
    return;
  }

  const adminClient = getAdminClient();

  // Find user in profiles (using adminClient to bypass RLS)
  const { data: targetProfile, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, role")
    .ilike("email", targetEmail)
    .maybeSingle();

  if (profileErr || !targetProfile) {
    return;
  }

  // Find latest balance
  const { data: latestLedger } = await adminClient
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", targetProfile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentBalance = latestLedger?.balance_after ?? 0;
  const newBalance = currentBalance + amount;

  // Insert ledger entry
  await adminClient.from("credit_ledger").insert({
    user_id: targetProfile.id,
    amount,
    balance_after: newBalance,
    reason: "admin_manual_grant",
    reference_id: `admin_${Date.now()}`,
  });

  revalidatePath("/admin");
}

