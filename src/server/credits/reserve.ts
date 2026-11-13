import "server-only";
import { getAdminClient } from "../supabase/admin";

export interface ReserveCreditResult {
  success: boolean;
  balanceAfter?: number;
  deductedAmount: number;
  isDailyQuota: boolean;
  error?: string;
}

/**
 * Atomically reserves tutor/student credits before invoking LLM generation.
 * Strictly decrements the balance in the append-only `credit_ledger`.
 *
 * Rules:
 * 1. Admin: Unlimited quota, logs deductive test credit transactions.
 * 2. Regular Students using Free Daily Quota (<= 3/day, 1 End-Sem trial/day):
 *    - Deducts 0 credits (amount: 0, balance_after unchanged).
 *    - Reason tagged with `_daily_quota`.
 *    - Returns deductedAmount: 0 (so any generation failure refunds 0 credits).
 * 3. Regular Students using Paid Credits (beyond daily quota or subsequent End-Sem):
 *    - Deducts required credits (amount: -amount, balance_after: balance - amount).
 *    - Reason tagged with `_paid_credits`.
 *    - Returns deductedAmount: amount (so any failure refunds the exact deducted credits).
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
    currentBalance = isAdmin ? 9999 : 0;
  }

  // 2. Check daily free quota & balance
  const { getDailyQuotaStatus } = await import("./daily-quota");
  const quota = await getDailyQuotaStatus(userId);

  // Case A: Admin (Unlimited testing)
  if (quota.isUnlimited) {
    const effectiveAmount = amount;
    const newBalance = Math.max(0, currentBalance - effectiveAmount);

    const { error: insertErr } = await supabase.from("credit_ledger").insert({
      user_id: userId,
      amount: -effectiveAmount,
      balance_after: newBalance,
      reason,
      reference_id: referenceId || null,
    });

    if (insertErr) {
      return {
        success: false,
        deductedAmount: 0,
        isDailyQuota: false,
        error: `Failed to record credit reservation: ${insertErr.message}`,
      };
    }

    return {
      success: true,
      balanceAfter: newBalance,
      deductedAmount: effectiveAmount,
      isDailyQuota: false,
    };
  }

  // Case B: Regular Student / User
  const isEndSem = reason.toLowerCase().includes("end_sem");
  const hasDailySlot = quota.remainingToday > 0;
  const canUseDailyTrial = !isEndSem || !quota.premiumTrialsUsed.endSem;
  const isCoveredByDailyQuota = hasDailySlot && canUseDailyTrial;

  let effectiveAmount = 0;
  let transactionReason = `${reason}_daily_quota`;
  let isDailyQuota = true;

  if (isCoveredByDailyQuota) {
    // FREE DAILY QUOTA: Deducts 0 credits. Balance remains unchanged!
    effectiveAmount = 0;
    isDailyQuota = true;
    transactionReason = `${reason}_daily_quota`;
  } else {
    // Requires paid credits
    if (currentBalance < amount) {
      const quotaMsg = !hasDailySlot
        ? `Daily free quota reached (used ${quota.totalDailyLimit}/${quota.totalDailyLimit} today). Free quota resets tonight at ${quota.resetsAtFormatted}.`
        : `You have already used your 1 free End-Sem trial for today.`;

      return {
        success: false,
        deductedAmount: 0,
        isDailyQuota: false,
        error: `${quotaMsg} You need ${amount} credit(s), but your current credit balance is ${currentBalance}.`,
      };
    }

    effectiveAmount = amount;
    isDailyQuota = false;
    transactionReason = `${reason}_paid_credits`;
  }

  const newBalance = Math.max(0, currentBalance - effectiveAmount);

  // 3. Append entry to immutable ledger
  const { error: insertErr } = await supabase.from("credit_ledger").insert({
    user_id: userId,
    amount: -effectiveAmount, // 0 for daily quota, -amount for paid credits
    balance_after: newBalance,
    reason: transactionReason,
    reference_id: referenceId || null,
  });

  if (insertErr) {
    return {
      success: false,
      deductedAmount: 0,
      isDailyQuota,
      error: `Failed to record credit reservation: ${insertErr.message}`,
    };
  }

  return {
    success: true,
    balanceAfter: newBalance,
    deductedAmount: effectiveAmount,
    isDailyQuota,
  };
}
