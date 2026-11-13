import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savePushSubscription } from "@/server/push/store";

export async function POST(req: NextRequest) {
  try {
    const sub = await req.json();
    if (!sub || !sub.endpoint) {
      return NextResponse.json({ ok: false, error: "Invalid subscription payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const res = await savePushSubscription(sub, user?.id);
    return NextResponse.json(res);
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
