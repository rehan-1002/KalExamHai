import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDailyQuotaStatus } from "@/server/credits/daily-quota";
import { AdminBar } from "@/components/navigation/admin-bar";
import { WorkspaceNav } from "@/components/navigation/workspace-nav";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tutor");
  }

  const isAdmin = isAdminEmail(user.email);
  const adminClient = getAdminClient();

  const { data: ledgerEntry } = await adminClient
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const creditBalance = ledgerEntry?.balance_after ?? (isAdmin ? 9999 : 2);
  const quota = await getDailyQuotaStatus(user.id);

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1F2937] flex flex-col">
      <AdminBar userEmail={user.email ?? ""} />
      <WorkspaceNav
        userEmail={user.email ?? ""}
        creditBalance={creditBalance}
        mode="tutor"
        isAdmin={isAdmin}
        quota={quota}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

