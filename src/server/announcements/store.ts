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
const CACHE_TTL_MS = 30000;

export async function getGlobalAnnouncement(): Promise<AnnouncementConfig> {
  const now = Date.now();
  if (cachedAnnouncement && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedAnnouncement;
  }

  const fallback: AnnouncementConfig = {
    active: true,
    text: "NEP-2020 Mumbai University Dec 2024 repeat question patterns now integrated!",
    badge: "🔥 NEW UPDATE",
    link: "/student/cram/new?type=kt_buster",
    updatedAt: now,
  };

  try {
    const supabase = getAdminClient();
    const { data } = await supabase.storage
      .from("documents")
      .download("config/announcement.json");

    if (data) {
      const parsed = JSON.parse(await data.text()) as AnnouncementConfig;
      cachedAnnouncement = parsed;
      lastCacheTime = now;
      return parsed;
    }
  } catch {}

  cachedAnnouncement = fallback;
  lastCacheTime = now;
  return fallback;
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
    await supabase.storage
      .from("documents")
      .upload("config/announcement.json", Buffer.from(JSON.stringify(updated), "utf-8"), {
        contentType: "application/json",
        upsert: true,
      });

    cachedAnnouncement = updated;
    return { ok: true };
  } catch (err) {
    console.error("Failed to save global announcement:", err);
    return { ok: false };
  }
}
