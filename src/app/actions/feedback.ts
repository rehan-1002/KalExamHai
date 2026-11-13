"use server";

import { createClient } from "@/lib/supabase/server";
import { submitStudentFeedback, type FeedbackCategory } from "@/server/feedback/store";

export async function submitFeedbackAction(params: {
  category: FeedbackCategory;
  message: string;
  pageUrl: string;
  deviceInfo: string;
}) {
  if (!params.message || params.message.trim().length < 3) {
    return { ok: false, error: "Please write a brief message before submitting." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "anonymous@student.mu.ac.in";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const userId = user?.id || "guest";

  const res = await submitStudentFeedback({
    userId,
    userEmail,
    userName,
    category: params.category,
    message: params.message.trim(),
    pageUrl: params.pageUrl || "/",
    deviceInfo: params.deviceInfo || "Browser",
  });

  return res;
}

