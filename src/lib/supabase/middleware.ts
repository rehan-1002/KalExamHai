import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Guard protected routes for unauthenticated visitors
  const isProtectedPath =
    pathname.startsWith("/student") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/admin");

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Role-based routing for authenticated users
  if (user) {
    // Master admin check
    const isAdmin = isAdminEmail(user.email);

    // If visiting auth pages while already authenticated, redirect to appropriate portal
    if (pathname === "/login" || pathname === "/signup") {
      const userRole = user.user_metadata?.role || "student";
      const redirectUrl = request.nextUrl.clone();

      if (isAdmin) {
        redirectUrl.pathname = "/tutor"; // Admins default to Tutor workspace with full toggle
      } else if (userRole === "tutor") {
        redirectUrl.pathname = "/tutor";
      } else {
        redirectUrl.pathname = "/student";
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Role boundary guards (Admins bypass all guards)
    if (!isAdmin) {
      const userRole = user.user_metadata?.role || "student";

      if (pathname.startsWith("/admin")) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = userRole === "tutor" ? "/tutor" : "/student";
        return NextResponse.redirect(redirectUrl);
      }

      if (pathname.startsWith("/tutor") && userRole !== "tutor") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/student";
        return NextResponse.redirect(redirectUrl);
      }

      if (pathname.startsWith("/student") && userRole !== "student") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/tutor";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
