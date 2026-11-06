import "server-only";
import { getAdminClient } from "@/server/supabase/admin";

export interface TelegramSession {
  sessionId: string;
  chatId: number | string;
  fileName: string;
  subject: string;
  text: string;
  created: number;
}

// In-memory cache for fast sub-second access across warm invocations
const memoryCache = new Map<string, TelegramSession>();

/**
 * Saves a Telegram study session (syllabus text + metadata).
 * Uses in-memory cache and persists to Supabase storage to survive cold starts.
 */
export async function saveTelegramSession(
  sessionId: string,
  data: Omit<TelegramSession, "sessionId" | "created">
): Promise<void> {
  const session: TelegramSession = {
    ...data,
    sessionId,
    created: Date.now(),
  };

  memoryCache.set(sessionId, session);

  // Evict older memory cache items if over 200 sessions
  if (memoryCache.size > 200) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  // Persist to Supabase storage in background for persistence
  try {
    const supabase = getAdminClient();
    const jsonStr = JSON.stringify(session);
    await supabase.storage
      .from("documents")
      .upload(`telegram_sessions/${sessionId}.json`, Buffer.from(jsonStr, "utf-8"), {
        contentType: "application/json",
        upsert: true,
      });
  } catch {
    // Ignore storage errors; in-memory cache is active
  }
}

/**
 * Retrieves a Telegram study session by ID.
 */
export async function getTelegramSession(sessionId: string): Promise<TelegramSession | null> {
  // 1. Check in-memory cache first
  const cached = memoryCache.get(sessionId);
  if (cached) {
    return cached;
  }

  // 2. Fallback to Supabase storage
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .download(`telegram_sessions/${sessionId}.json`);

    if (!error && data) {
      const text = await data.text();
      const session = JSON.parse(text) as TelegramSession;
      memoryCache.set(sessionId, session);
      return session;
    }
  } catch {
    // Fall through if not found
  }

  return null;
}
