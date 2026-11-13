import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savePushSubscription } from "@/server/push/store";
import { isAdminEmail } from "@/lib/auth/admin";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const sub = payload.subscription || payload;
    if (!sub || !sub.endpoint) {
      return NextResponse.json({ ok: false, error: "Invalid subscription payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin = (user?.email && isAdminEmail(user.email)) || payload.role === "admin";
    const role = isAdmin ? "admin" : "student";

    const res = await savePushSubscription(sub, user?.id, role);
    if (res.ok) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/admin");
    }
    return NextResponse.json(res);
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

