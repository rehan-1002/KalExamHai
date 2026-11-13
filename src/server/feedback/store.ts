import "server-only";

import { getAdminClient } from "@/server/supabase/admin";

export type FeedbackCategory = "bug" | "suggestion" | "syllabus" | "general";

export interface StudentFeedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: FeedbackCategory;
  message: string;
  pageUrl: string;
  deviceInfo: string;
  createdAt: number;
  status: "new" | "resolved";
}

let cachedFeedback: StudentFeedback[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20000;

export async function submitStudentFeedback(
  data: Omit<StudentFeedback, "id" | "createdAt" | "status">
): Promise<{ ok: boolean; id: string; error?: string }> {
  try {
    const supabase = getAdminClient();
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: StudentFeedback = {
      ...data,
      id,
      createdAt: Date.now(),
      status: "new",
    };

    const filePath = `feedbacks/${id}.txt`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(JSON.stringify(record), "utf-8"), {
        contentType: "text/plain",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error for feedback:", uploadError);
      return { ok: false, id: "", error: uploadError.message };
    }

    cachedFeedback = null;

    // 🚀 Instant Lockscreen Web Push Notification directly to Admin
    try {
      const { sendAdminFeedbackPush } = await import("@/server/push/store");
      sendAdminFeedbackPush({
        userName: data.userName || "Student",
        category: data.category,
        message: data.message,
        pageUrl: data.pageUrl,
      }).catch((pushErr) => {
        console.error("Admin push dispatch error:", pushErr);
      });
    } catch (e) {
      console.error("Failed to load push module:", e);
    }

    return { ok: true, id };
  } catch (err: unknown) {
    console.error("Failed to submit feedback:", err);
    return { ok: false, id: "", error: err instanceof Error ? err.message : "Submission failed" };
  }
}

export async function getStudentFeedbacks(): Promise<StudentFeedback[]> {
  const now = Date.now();
  if (cachedFeedback && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedFeedback;
  }

  try {
    const supabase = getAdminClient();
    const { data: files } = await supabase.storage.from("documents").list("feedbacks", {
      limit: 500,
    });

    if (!files || files.length === 0) {
      cachedFeedback = [];
      lastCacheTime = now;
      return [];
    }

    const items: StudentFeedback[] = [];
    const promises = files
      .filter((f) => f.name.endsWith(".txt") || f.name.endsWith(".json"))
      .map(async (f) => {
        try {
          const { data } = await supabase.storage
            .from("documents")
            .download(`feedbacks/${f.name}`);
          if (data) {
            const parsed = JSON.parse(await data.text()) as StudentFeedback;
            items.push(parsed);
          }
        } catch {}
      });

    await Promise.all(promises);

    const sorted = items.sort((a, b) => b.createdAt - a.createdAt);
    cachedFeedback = sorted;
    lastCacheTime = now;
    return sorted;
  } catch (err) {
    console.error("Error fetching feedbacks:", err);
    return [];
  }
}

export async function updateFeedbackStatus(
  id: string,
  status: "new" | "resolved"
): Promise<{ ok: boolean }> {
  try {
    const supabase = getAdminClient();
    let filePath = `feedbacks/${id}.txt`;
    let { data } = await supabase.storage.from("documents").download(filePath);
    if (!data) {
      filePath = `feedbacks/${id}.json`;
      const res = await supabase.storage.from("documents").download(filePath);
      data = res.data;
    }
    if (!data) return { ok: false };

    const parsed = JSON.parse(await data.text()) as StudentFeedback;
    parsed.status = status;

    await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(JSON.stringify(parsed), "utf-8"), {
        contentType: "text/plain",
        upsert: true,
      });

    cachedFeedback = null;
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

