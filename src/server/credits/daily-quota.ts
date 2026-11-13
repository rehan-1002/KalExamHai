import "server-only";

import { getAdminClient } from "../supabase/admin";
import { isAdminEmail } from "@/lib/auth/admin";

export const DAILY_FREE_LIMIT = 3;

export interface DailyQuotaStatus {
  isUnlimited: boolean;
  totalDailyLimit: number;
  usedToday: number;
  remainingToday: number;
  resetsAtFormatted: string; // e.g., "12:00 AM IST"
  resetsAtIso: string;
  premiumTrialsUsed: {
    endSem: boolean;
    survivalKit: boolean;
    vivaPrep: boolean;
  };
  canGenerate: boolean;
  message?: string;
}

export type GeneratableType =
  | "IAT"
  | "END_SEM"
  | "flashcards"
  | "quick_notes"
  | "viva_prep"
  | "survival_kit"
  | "kt_buster";

/**
 * Calculates start of current day in Indian Standard Time (IST: UTC+5:30) as a UTC Date.
 */
export function getStartOfTodayIST(): Date {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - istOffsetMs);
}

/**
 * Calculates the next midnight in Indian Standard Time (IST) as a UTC Date.
 */
export function getNextMidnightIST(): Date {
  const start = getStartOfTodayIST();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Retrieves the live daily generation quota status for a user.
 */
export async function getDailyQuotaStatus(userId: string): Promise<DailyQuotaStatus> {
  const supabase = getAdminClient();
  const startOfToday = getStartOfTodayIST().toISOString();
  const nextMidnight = getNextMidnightIST();

  // 1. Check if user is an admin (permanent unlimited bypass)
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);

  const isAdmin = profile?.role === "admin" || isAdminEmail(authUser?.user?.email);

  const resetsAtFormatted = "12:00 AM IST";
  const resetsAtIso = nextMidnight.toISOString();

  if (isAdmin) {
    return {
      isUnlimited: true,
      totalDailyLimit: DAILY_FREE_LIMIT,
      usedToday: 0,
      remainingToday: 9999,
      resetsAtFormatted,
      resetsAtIso,
      premiumTrialsUsed: {
        endSem: false,
        survivalKit: false,
        vivaPrep: false,
      },
      canGenerate: true,
    };
  }

  // 2. Query today's generated question papers
  const { data: papersToday } = await supabase
    .from("generated_papers")
    .select("format, created_at")
    .eq("owner_id", userId)
    .gte("created_at", startOfToday);

  // 3. Query today's generated cram artifacts
  const { data: cramToday } = await supabase
    .from("cram_artifacts")
    .select("artifact_type, created_at")
    .eq("owner_id", userId)
    .gte("created_at", startOfToday);

  const papers = papersToday || [];
  const cram = cramToday || [];

  const totalUsedToday = papers.length + cram.length;
  const remainingToday = Math.max(0, DAILY_FREE_LIMIT - totalUsedToday);

  const endSemUsed = papers.some((p) => p.format === "END_SEM");
  const survivalKitUsed = cram.some((c) => c.artifact_type === "survival_kit");
  const vivaPrepUsed = cram.some((c) => c.artifact_type === "viva_prep");

  return {
    isUnlimited: false,
    totalDailyLimit: DAILY_FREE_LIMIT,
    usedToday: totalUsedToday,
    remainingToday,
    resetsAtFormatted,
    resetsAtIso,
    premiumTrialsUsed: {
      endSem: endSemUsed,
      survivalKit: survivalKitUsed,
      vivaPrep: vivaPrepUsed,
    },
    canGenerate: remainingToday > 0,
    message:
      remainingToday === 0
        ? `You have reached your daily limit of ${DAILY_FREE_LIMIT} free generations. Your quota will reset tonight at ${resetsAtFormatted}.`
        : undefined,
  };
}

/**
 * Checks whether a specific generation type is permitted for the user today.
 * If daily free quota is exhausted or premium 1-trial is already consumed,
 * allows bypass if the user holds sufficient balance in `credit_ledger`.
 */
export async function checkCanGenerate(
  userId: string,
  type: GeneratableType,
  creditCost?: number
): Promise<{ allowed: boolean; reason?: string; quotaStatus: DailyQuotaStatus; isPaidCreditBypass?: boolean }> {
  const quota = await getDailyQuotaStatus(userId);

  if (quota.isUnlimited) {
    return { allowed: true, quotaStatus: quota };
  }

  // Helper to check if user has paid credits to bypass daily free quota limit
  async function hasPaidCreditCoverage(cost: number): Promise<boolean> {
    const supabase = getAdminClient();
    const { data: latestRow } = await supabase
      .from("credit_ledger")
      .select("balance_after")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (latestRow?.balance_after ?? 0) >= cost;
  }

  const cost = creditCost ?? (type === "END_SEM" ? 2 : 1);

  // 1. Check general daily limit
  if (quota.remainingToday <= 0) {
    if (await hasPaidCreditCoverage(cost)) {
      return { allowed: true, quotaStatus: quota, isPaidCreditBypass: true };
    }
    return {
      allowed: false,
      reason: `Daily free quota reached (used ${DAILY_FREE_LIMIT}/${DAILY_FREE_LIMIT} today). Your free quota will reset tonight at ${quota.resetsAtFormatted}!`,
      quotaStatus: quota,
    };
  }

  // 2. Check 1-trial/day limits on premium features
  if (type === "END_SEM" && quota.premiumTrialsUsed.endSem) {
    if (await hasPaidCreditCoverage(cost)) {
      return { allowed: true, quotaStatus: quota, isPaidCreditBypass: true };
    }
    return {
      allowed: false,
      reason: `You have already used your 1 free End-Sem (60M) trial paper for today! You can still generate IAT (20M) papers with your ${quota.remainingToday} remaining free slot(s) today, or use credits.`,
      quotaStatus: quota,
    };
  }

  if (type === "survival_kit" && quota.premiumTrialsUsed.survivalKit) {
    return {
      allowed: false,
      reason: `You have already used your 1 free Last-Minute Survival Kit trial for today! You can still generate 3D Flashcards and Quick Notes with your ${quota.remainingToday} remaining free slot(s) today.`,
      quotaStatus: quota,
    };
  }

  return { allowed: true, quotaStatus: quota };
}

