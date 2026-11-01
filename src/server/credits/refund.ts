import "server-only";
import { getAdminClient } from "../supabase/admin";

export interface RefundCreditResult {
  success: boolean;
  balanceAfter?: number;
  error?: string;
}

/**
 * Refunds previously reserved credits if generation fails validation after retries.
 * Appends a positive credit entry to `credit_ledger`.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<RefundCreditResult> {
  const supabase = getAdminClient();

  const { data: latestRow } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentBalance = latestRow?.balance_after ?? 0;
  const newBalance = currentBalance + amount;

  const { error } = await supabase.from("credit_ledger").insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    reason,
    reference_id: referenceId || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    balanceAfter: newBalance,
  };
}
