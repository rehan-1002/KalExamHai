import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const isAdmin = isAdminEmail(user.email);
      
      // Look up role from metadata or profiles table
      let role = user.user_metadata?.role;
      if (!role && !isAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role) {
          role = profile.role;
        } else {
          role = "student";
        }
      }

      // If user came with a specific destination redirect, honor it
      if (next && next !== "/") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Default role destination
      if (isAdmin || role === "tutor") {
        return NextResponse.redirect(`${origin}/tutor`);
      } else {
        return NextResponse.redirect(`${origin}/student`);
      }
    }
  }

  // Return the user to an error page with instructions if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
