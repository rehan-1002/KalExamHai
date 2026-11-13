import "server-only";

import { setVapidDetails, sendNotification, type PushSubscription } from "web-push";
import { getAdminClient } from "@/server/supabase/admin";

export interface StoredPushSubscription {
  id: string;
  subscription: PushSubscription;
  userId?: string;
  role?: string;
  createdAt: number;
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:admin@kalexamhai.in";

if (publicKey && privateKey) {
  setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Saves or updates a browser PushSubscription in persistent storage.
 */
export async function savePushSubscription(
  sub: PushSubscription,
  userId?: string,
  role?: string
): Promise<{ ok: boolean }> {
  try {
    const supabase = getAdminClient();
    // Use hash of endpoint as unique id
    const endpointHash = Buffer.from(sub.endpoint).toString("base64url").slice(0, 40);
    const id = `sub_${endpointHash}`;

    const record: StoredPushSubscription = {
      id,
      subscription: sub,
      userId: userId || "guest",
      role: role || (userId ? "student" : "guest"),
      createdAt: Date.now(),
    };

    await supabase.storage
      .from("documents")
      .upload(`push_subs/${id}.txt`, Buffer.from(JSON.stringify(record), "utf-8"), {
        contentType: "text/plain",
        upsert: true,
      });

    return { ok: true };
  } catch (err) {
    console.error("Failed to save push subscription:", err);
    return { ok: false };
  }
}

/**
 * Fetches all registered push subscriptions.
 */
export async function getPushSubscriptions(): Promise<StoredPushSubscription[]> {
  try {
    const supabase = getAdminClient();
    const { data: files } = await supabase.storage.from("documents").list("push_subs", {
      limit: 1000,
    });

    if (!files || files.length === 0) return [];

    const subs: StoredPushSubscription[] = [];
    const promises = files
      .filter((f) => f.name.endsWith(".txt") || f.name.endsWith(".json"))
      .map(async (f) => {
        try {
          const { data } = await supabase.storage.from("documents").download(`push_subs/${f.name}`);
          if (data) {
            const parsed = JSON.parse(await data.text()) as StoredPushSubscription;
            subs.push(parsed);
          }
        } catch {}
      });

    await Promise.all(promises);
    return subs;
  } catch (err) {
    console.error("Error retrieving push subscriptions:", err);
    return [];
  }
}

/**
 * Sends a lock-screen Push Notification to all subscribed devices.
 */
export async function sendWebPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ total: number; sent: number; failed: number }> {
  const subs = await getPushSubscriptions();
  let sent = 0;
  let failed = 0;

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/student",
  });

  const promises = subs.map(async (item) => {
    try {
      await sendNotification(item.subscription, payloadString);
      sent++;
    } catch (err: unknown) {
      failed++;
      // If subscription expired or gone (410 / 404), delete from storage
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        try {
          const supabase = getAdminClient();
          await supabase.storage.from("documents").remove([`push_subs/${item.id}.json`]);
        } catch {}
      }
    }
  });

  await Promise.all(promises);
  return { total: subs.length, sent, failed };
}

/**
 * Sends an instant vibrating Lockscreen Push Notification directly to Admin devices
 * whenever a student submits feedback or reports a bug.
 */
export async function sendAdminFeedbackPush(payload: {
  userName: string;
  category: string;
  message: string;
  pageUrl?: string;
}): Promise<{ sent: number; total: number }> {
  try {
    const subs = await getPushSubscriptions();
    if (subs.length === 0) return { sent: 0, total: 0 };

    // Target admin devices first; if none specifically tagged, send to active devices
    const adminSubs = subs.filter((s) => s.role === "admin");
    const targetSubs = adminSubs.length > 0 ? adminSubs : subs;

    const categoryEmoji: Record<string, string> = {
      bug: "🐛 Bug Report",
      suggestion: "💡 New Suggestion",
      syllabus: "📚 Syllabus Gap",
      general: "💬 Student Feedback",
    };

    const categoryTitle = categoryEmoji[payload.category] || "💬 New Feedback";

    const payloadString = JSON.stringify({
      title: `🚨 ${categoryTitle} — ${payload.userName || "Student"}`,
      body: payload.message.length > 120 ? `${payload.message.slice(0, 117)}...` : payload.message,
      url: "/admin#feedback",
      tag: `feedback-${Date.now()}`,
    });

    let sent = 0;
    const promises = targetSubs.map(async (item) => {
      try {
        await sendNotification(item.subscription, payloadString);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          try {
            const supabase = getAdminClient();
            await supabase.storage.from("documents").remove([`push_subs/${item.id}.json`]);
          } catch {}
        }
      }
    });

    await Promise.all(promises);
    return { sent, total: targetSubs.length };
  } catch (err) {
    console.error("Failed to broadcast admin feedback push notification:", err);
    return { sent: 0, total: 0 };
  }
}
