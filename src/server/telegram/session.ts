import "server-only";
import { getAdminClient } from "@/server/supabase/admin";
import type { TelegramArtifactType } from "./generator";

export interface TelegramSession {
  sessionId: string;
  chatId: number | string;
  fileName: string;
  subject: string;
  text: string;
  created: number;
}

export interface TelegramExport {
  exportId: string;
  type: TelegramArtifactType;
  subject: string;
  title: string;
  content: string;
  created: number;
}

// In-memory cache for fast sub-second access across warm invocations
const memoryCache = new Map<string, TelegramSession>();
const exportMemoryCache = new Map<string, TelegramExport>();

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

/**
 * Saves a generated artifact for public web view and instant A4 printing.
 */
export async function saveTelegramExport(
  exportId: string,
  data: Omit<TelegramExport, "exportId" | "created">
): Promise<void> {
  const item: TelegramExport = {
    ...data,
    exportId,
    created: Date.now(),
  };

  exportMemoryCache.set(exportId, item);

  if (exportMemoryCache.size > 200) {
    const oldestKey = exportMemoryCache.keys().next().value;
    if (oldestKey) exportMemoryCache.delete(oldestKey);
  }

  try {
    const supabase = getAdminClient();
    const jsonStr = JSON.stringify(item);
    await supabase.storage
      .from("documents")
      .upload(`tg_exports/${exportId}.json`, Buffer.from(jsonStr, "utf-8"), {
        contentType: "application/json",
        upsert: true,
      });
  } catch {
    // Ignore storage upload errors
  }
}

/**
 * Retrieves a public Telegram export by ID for web preview and printing.
 */
export async function getTelegramExport(exportId: string): Promise<TelegramExport | null> {
  const cached = exportMemoryCache.get(exportId);
  if (cached) return cached;

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .download(`tg_exports/${exportId}.json`);

    if (!error && data) {
      const text = await data.text();
      const item = JSON.parse(text) as TelegramExport;
      exportMemoryCache.set(exportId, item);
      return item;
    }
  } catch {
    // Fall through
  }

  return null;
}
