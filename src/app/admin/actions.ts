"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { broadcastTelegramMessage, getTelegramUsers } from "@/server/telegram/users";
import { saveGlobalAnnouncement } from "@/server/announcements/store";
import { updateFeedbackStatus } from "@/server/feedback/store";
import { sendWebPushNotification } from "@/server/push/store";

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user && isAdminEmail(user.email));
}

export async function broadcastTelegramAction(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  const message = (formData.get("message") as string) || "";
  if (!message.trim()) {
    return { ok: false, error: "Message cannot be empty" };
  }

  const result = await broadcastTelegramMessage(message.trim());
  revalidatePath("/admin");
  return { ok: true, ...result };
}

export async function updateAnnouncementAction(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  const active = formData.get("active") === "true";
  const text = (formData.get("text") as string) || "";
  const badge = (formData.get("badge") as string) || "📢 ANNOUNCEMENT";
  const link = (formData.get("link") as string) || "";

  await saveGlobalAnnouncement({ active, text: text.trim(), badge: badge.trim(), link: link.trim() });
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/");
  return { ok: true };
}

export async function resolveFeedbackAction(feedbackId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  await updateFeedbackStatus(feedbackId, "resolved");
  revalidatePath("/admin");
  return { ok: true };
}

export async function fetchLatestTelegramUsersAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized", users: [] };

  const users = await getTelegramUsers(true);
  return { ok: true, users };
}

export async function broadcastWebPushAction(formData: FormData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  const title = (formData.get("title") as string) || "KalExamHai Exam Alert";
  const body = (formData.get("body") as string) || "";
  const url = (formData.get("url") as string) || "/student";

  if (!body.trim()) {
    return { ok: false, error: "Notification body cannot be empty" };
  }

  const result = await sendWebPushNotification({
    title: title.trim(),
    body: body.trim(),
    url: url.trim(),
  });

  revalidatePath("/admin");
  return { ok: true, ...result };
}

export async function testAdminPushAction() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  const { sendAdminFeedbackPush } = await import("@/server/push/store");
  const result = await sendAdminFeedbackPush({
    userName: "Founder Alert Test",
    category: "suggestion",
    message: "Bhai instant feedback alert is working! You will get this lockscreen notification whenever a student gives feedback.",
    pageUrl: "/admin",
  });

  return { ok: true, sent: result.sent, total: result.total };
}

