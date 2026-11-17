import "server-only";

import { getAdminClient } from "@/server/supabase/admin";

export interface AnnouncementConfig {
  active: boolean;
  text: string;
  badge?: string;
  link?: string;
  updatedAt: number;
}

let cachedAnnouncement: AnnouncementConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000;

const DEFAULT_FALLBACK: AnnouncementConfig = {
  active: true,
  text: "NEP-2020 Mumbai University Dec 2024 repeat question patterns now integrated!",
  badge: "🔥 NEW UPDATE",
  link: "/student/cram/new?type=kt_buster",
  updatedAt: 1731800000000,
};

export async function getGlobalAnnouncement(): Promise<AnnouncementConfig> {
  const now = Date.now();
  if (cachedAnnouncement && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedAnnouncement;
  }

  try {
    const supabase = getAdminClient();
    // Use .txt and text/plain to comply with bucket MIME restrictions
    const { data, error } = await supabase.storage
      .from("documents")
      .download("config/announcement.txt");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as AnnouncementConfig;
      cachedAnnouncement = parsed;
      lastCacheTime = now;
      return parsed;
    }
  } catch (err) {
    console.warn("Storage announcement download exception, falling back:", err);
  }

  // If cached announcement exists in memory, keep serving it
  if (cachedAnnouncement) {
    return cachedAnnouncement;
  }

  cachedAnnouncement = DEFAULT_FALLBACK;
  lastCacheTime = now;
  return DEFAULT_FALLBACK;
}

export async function saveGlobalAnnouncement(
  config: Partial<AnnouncementConfig>
): Promise<{ ok: boolean }> {
  try {
    const current = await getGlobalAnnouncement();
    const updated: AnnouncementConfig = {
      ...current,
      ...config,
      updatedAt: Date.now(),
    };

    const supabase = getAdminClient();
    // Must use contentType: text/plain because documents bucket rejects application/json
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload("config/announcement.txt", Buffer.from(JSON.stringify(updated), "utf-8"), {
        contentType: "text/plain",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload announcement to storage:", uploadError);
      // Still keep in memory so it's not totally lost
      cachedAnnouncement = updated;
      lastCacheTime = Date.now();
      return { ok: false };
    }

    cachedAnnouncement = updated;
    lastCacheTime = Date.now();
    return { ok: true };
  } catch (err) {
    console.error("Failed to save global announcement:", err);
    return { ok: false };
  }
}

