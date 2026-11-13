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
  const filePath = `tg_users/${chatId}.json`;
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
    const { data } = await supabase.storage.from("documents").download(filePath);
    if (data) {
      const prev = JSON.parse(await data.text()) as TelegramUserProfile;
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
    await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(JSON.stringify(existing), "utf-8"), {
        contentType: "application/json",
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
export async function getTelegramUsers(): Promise<TelegramUserProfile[]> {
  const now = Date.now();
  if (cachedUsers && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedUsers;
  }

  const supabase = getAdminClient();

  try {
    // 1. Fetch explicitly tracked tg_users
    const { data: userFiles } = await supabase.storage.from("documents").list("tg_users", {
      limit: 1000,
    });

    const profilesMap = new Map<number, TelegramUserProfile>();

    if (userFiles && userFiles.length > 0) {
      const fetchPromises = userFiles
        .filter((f) => f.name.endsWith(".json"))
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
        const parts = sf.name.replace(".txt", "").split("_");
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

/**
 * Broadcasts a custom message to all registered Telegram users.
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
      await sendTelegramMessage(user.chatId, messageText);
      sent++;
      // Sleep 35ms between sends to stay well within Telegram's 30 msg/sec broadcast rate limit
      await new Promise((res) => setTimeout(res, 35));
    } catch {
      failed++;
    }
  }

  return { total: users.length, sent, failed };
}
