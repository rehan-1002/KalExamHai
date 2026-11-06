import "server-only";

import { getAdminClient } from "@/server/supabase/admin";
import { getStartOfTodayIST } from "@/server/credits/daily-quota";

export const TELEGRAM_DAILY_LIMIT = 5;

// In-memory cache for instant sub-second quota checks: key = `${chatId}_${dateKey}` -> count
const quotaMemoryCache = new Map<string, number>();

function getTodayKeyIST(): string {
  const start = getStartOfTodayIST();
  return start.toISOString().split("T")[0]!;
}

/**
 * Checks whether a Telegram user has exceeded their daily free generation limit (5/day).
 */
export async function checkTelegramQuota(chatId: number | string): Promise<{
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}> {
  const dateKey = getTodayKeyIST();
  const cacheKey = `${chatId}_${dateKey}`;

  let used = quotaMemoryCache.get(cacheKey);

  if (used === undefined) {
    // Fallback to Supabase storage for durability across serverless instances
    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase.storage
        .from("documents")
        .download(`tg_quotas/${cacheKey}.json`);

      if (!error && data) {
        const text = await data.text();
        const json = JSON.parse(text) as { used: number };
        used = json.used || 0;
      } else {
        used = 0;
      }
    } catch {
      used = 0;
    }
    quotaMemoryCache.set(cacheKey, used);
  }

  const remaining = Math.max(0, TELEGRAM_DAILY_LIMIT - used);
  return {
    allowed: used < TELEGRAM_DAILY_LIMIT,
    used,
    remaining,
    limit: TELEGRAM_DAILY_LIMIT,
  };
}

/**
 * Increments the Telegram generation counter for a user today.
 */
export async function incrementTelegramQuota(chatId: number | string): Promise<number> {
  const dateKey = getTodayKeyIST();
  const cacheKey = `${chatId}_${dateKey}`;

  let current = quotaMemoryCache.get(cacheKey) || 0;
  current += 1;
  quotaMemoryCache.set(cacheKey, current);

  // Evict older memory cache items if over 500 active users today
  if (quotaMemoryCache.size > 500) {
    const oldest = quotaMemoryCache.keys().next().value;
    if (oldest) quotaMemoryCache.delete(oldest);
  }

  // Persist to Supabase storage in background
  try {
    const supabase = getAdminClient();
    await supabase.storage
      .from("documents")
      .upload(
        `tg_quotas/${cacheKey}.json`,
        Buffer.from(JSON.stringify({ used: current, date: dateKey }), "utf-8"),
        { contentType: "application/json", upsert: true }
      );
  } catch {
    // Storage failure shouldn't block the user
  }

  return current;
}
