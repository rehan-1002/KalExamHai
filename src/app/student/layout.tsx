import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/server/supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";
import { getDailyQuotaStatus } from "@/server/credits/daily-quota";
import { AdminBar } from "@/components/navigation/admin-bar";
import { WorkspaceNav } from "@/components/navigation/workspace-nav";
import { getGlobalAnnouncement } from "@/server/announcements/store";
import { AnnouncementBanner } from "@/components/features/announcements/announcement-banner";
import { FeedbackWidget } from "@/components/features/feedback/feedback-widget";
import { PushPrompt } from "@/components/features/push/push-prompt";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/student");
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
  const [quota, announcement] = await Promise.all([
    getDailyQuotaStatus(user.id),
    getGlobalAnnouncement(),
  ]);

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1F2937] flex flex-col">
      <AdminBar userEmail={user.email ?? ""} />
      <AnnouncementBanner announcement={announcement} />
      <WorkspaceNav
        userEmail={user.email ?? ""}
        creditBalance={creditBalance}
        mode="student"
        isAdmin={isAdmin}
        quota={quota}
      />
      <main className="flex-1">{children}</main>
      <FeedbackWidget
        userEmail={user.email ?? ""}
        userName={user.user_metadata?.full_name || user.email?.split("@")[0]}
      />
      <PushPrompt />
    </div>
  );
}

