import "server-only";

import { getAdminClient } from "@/server/supabase/admin";
import { sendTelegramMessage } from "./bot";

export interface TelegramUserProfile {
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  lastSubject?: string;
  firstSeen: number;
  lastActive: number;
  sessionCount: number;
}

// In-memory cache for ultra-fast dashboard queries
let cachedUsers: TelegramUserProfile[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Records or updates a Telegram user's activity in persistent storage.
 */
export async function recordTelegramUser(
  chatId: number,
  info: {
    firstName?: string;
    lastName?: string;
    username?: string;
    subject?: string;
  }
): Promise<void> {
  const supabase = getAdminClient();
  const filePath = `tg_users/${chatId}.txt`;
  const legacyFilePath = `tg_users/${chatId}.json`;
  const now = Date.now();

  let existing: TelegramUserProfile = {
    chatId,
    firstName: info.firstName || "",
    lastName: info.lastName || "",
    username: info.username || "",
    lastSubject: info.subject || "General Inquiry",
    firstSeen: now,
    lastActive: now,
    sessionCount: 1,
  };

  try {
    let dl = await supabase.storage.from("documents").download(filePath);
    if (dl.error || !dl.data) {
      dl = await supabase.storage.from("documents").download(legacyFilePath);
    }
    if (dl.data) {
      const prev = JSON.parse(await dl.data.text()) as TelegramUserProfile;
      existing = {
        ...prev,
        firstName: info.firstName || prev.firstName || "",
        lastName: info.lastName || prev.lastName || "",
        username: info.username || prev.username || "",
        lastSubject: info.subject || prev.lastSubject,
        lastActive: now,
        sessionCount: (prev.sessionCount || 0) + 1,
      };
    }
  } catch {
    // New user
  }

  try {
    // Must use text/plain because documents bucket rejects application/json
    await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(JSON.stringify(existing), "utf-8"), {
        contentType: "text/plain",
        upsert: true,
      });

    // Invalidate local cache
    cachedUsers = null;
  } catch (err) {
    console.error("Failed to persist telegram user profile:", err);
  }
}

/**
 * Returns all Telegram users, auto-migrating historical sessions on first run.
 */
export async function getTelegramUsers(forceRefresh = false): Promise<TelegramUserProfile[]> {
  const now = Date.now();
  if (!forceRefresh && cachedUsers && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedUsers;
  }

  const supabase = getAdminClient();

  try {
    // 1. Fetch explicitly tracked tg_users (.txt and legacy .json)
    const { data: userFiles } = await supabase.storage.from("documents").list("tg_users", {
      limit: 1000,
    });

    const profilesMap = new Map<number, TelegramUserProfile>();

    if (userFiles && userFiles.length > 0) {
      const fetchPromises = userFiles
        .filter((f) => f.name.endsWith(".txt") || f.name.endsWith(".json"))
        .map(async (f) => {
          try {
            const { data } = await supabase.storage
              .from("documents")
              .download(`tg_users/${f.name}`);
            if (data) {
              const profile = JSON.parse(await data.text()) as TelegramUserProfile;
              profilesMap.set(profile.chatId, profile);
            }
          } catch {
            // Ignore corrupted individual profiles
          }
        });

      await Promise.all(fetchPromises);
    }

    // 2. Discover historical sessions from telegram_sessions if not yet fully in profilesMap
    const { data: sessionFiles } = await supabase.storage
      .from("documents")
      .list("telegram_sessions", { limit: 1000 });

    if (sessionFiles && sessionFiles.length > 0) {
      for (const sf of sessionFiles) {
        const parts = sf.name.replace(/\.(txt|json)$/, "").split("_");
        const chatId = parseInt(parts[0] || "0", 10);
        const timestamp = parseInt(parts[1] || "0", 10) || now;

        if (chatId && !profilesMap.has(chatId)) {
          profilesMap.set(chatId, {
            chatId,
            firstName: "MU Student",
            username: "",
            lastSubject: "Official NEP-2020 Study Session",
            firstSeen: timestamp,
            lastActive: timestamp,
            sessionCount: 1,
          });
        } else if (chatId && profilesMap.has(chatId)) {
          const p = profilesMap.get(chatId)!;
          p.sessionCount = Math.max(p.sessionCount, (p.sessionCount || 0) + 1);
          if (timestamp > p.lastActive) p.lastActive = timestamp;
          if (timestamp < p.firstSeen) p.firstSeen = timestamp;
        }
      }
    }

    const result = Array.from(profilesMap.values()).sort(
      (a, b) => b.lastActive - a.lastActive
    );

    cachedUsers = result;
    lastCacheTime = now;
    return result;
  } catch (err) {
    console.error("Error retrieving Telegram users:", err);
    return [];
  }
}

export const BROADCAST_INLINE_KEYBOARD = {
  inline_keyboard: [
    [
      {
        text: "⚡ 24-Hr KT Buster Kit (Pass Guarantee)",
        url: "https://kalexamhai-one.vercel.app/student/cram/new?type=kt_buster",
      },
    ],
    [
      {
        text: "🎯 Start Cram Session",
        url: "https://kalexamhai-one.vercel.app/student/cram/new",
      },
      {
        text: "📝 MU Past Papers Archive",
        url: "https://kalexamhai-one.vercel.app/student/papers",
      },
    ],
    [
      {
        text: "🌐 Open KalExamHai Web App",
        url: "https://kalexamhai-one.vercel.app",
      },
    ],
  ],
};

/**
 * Sends a direct personalized message to a specific Telegram user with action buttons.
 */
export async function sendDirectTelegramMessage(
  chatId: number,
  messageText: string
): Promise<{ ok: boolean; chatId: number; error?: string }> {
  try {
    await sendTelegramMessage(chatId, messageText, {
      reply_markup: BROADCAST_INLINE_KEYBOARD,
    });
    return { ok: true, chatId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to deliver message";
    return { ok: false, chatId, error: msg };
  }
}

/**
 * Broadcasts a custom message to all registered Telegram users with high-converting web links.
 */
export async function broadcastTelegramMessage(messageText: string): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  const users = await getTelegramUsers();
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await sendTelegramMessage(user.chatId, messageText, {
        reply_markup: BROADCAST_INLINE_KEYBOARD,
      });
      sent++;
      // Sleep 35ms between sends to stay well within Telegram's 30 msg/sec broadcast rate limit
      await new Promise((res) => setTimeout(res, 35));
    } catch {
      failed++;
    }
  }

  return { total: users.length, sent, failed };
}

