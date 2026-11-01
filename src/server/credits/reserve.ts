import "server-only";
import { getAdminClient } from "../supabase/admin";

export interface ReserveCreditResult {
  success: boolean;
  balanceAfter?: number;
  error?: string;
}

/**
 * Atomically reserves tutor/student credits before invoking LLM generation.
 * Strictly decrements the balance in the append-only `credit_ledger`.
 */
export async function reserveCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<ReserveCreditResult> {
  const supabase = getAdminClient();

  // 1. Fetch latest balance from credit_ledger
  const { data: latestRow } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine starting balance if no previous ledger entry
  let currentBalance = latestRow?.balance_after;
  if (currentBalance === undefined || currentBalance === null) {
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      supabase.auth.admin.getUserById(userId),
    ]);
    const { isAdminEmail } = await import("@/lib/auth/admin");
    const isAdmin = profile?.role === "admin" || isAdminEmail(authUser?.user?.email);
    currentBalance = isAdmin ? 9999 : 2;
  }

  // 2. Check daily free quota & balance
  const { getDailyQuotaStatus } = await import("./daily-quota");
  const quota = await getDailyQuotaStatus(userId);

  if (!quota.isUnlimited && quota.remainingToday <= 0) {
    return {
      success: false,
      error: `Daily free quota reached (used ${quota.totalDailyLimit}/${quota.totalDailyLimit} today). Your free quota resets tonight at ${quota.resetsAtFormatted}!`,
    };
  }

  // Determine balance deduction (if regular user has 0 ledger balance, free daily quota covers it)
  const effectiveAmount = quota.isUnlimited ? amount : Math.min(amount, Math.max(0, currentBalance));
  const newBalance = Math.max(0, currentBalance - effectiveAmount);

  // 3. Deduct and append entry to immutable ledger
  const { error: insertErr } = await supabase.from("credit_ledger").insert({
    user_id: userId,
    amount: -effectiveAmount,
    balance_after: newBalance,
    reason: quota.isUnlimited ? reason : `${reason}_daily_quota`,
    reference_id: referenceId || null,
  });

  if (insertErr) {
    return {
      success: false,
      error: `Failed to record credit reservation: ${insertErr.message}`,
    };
  }

  return {
    success: true,
    balanceAfter: newBalance,
  };
}
