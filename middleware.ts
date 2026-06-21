import { NextResponse, type NextRequest } from "next/server";

/**
 * IMPORTANT: Next.js middleware ALWAYS runs in the Edge Runtime (V8 isolate).
 * `@supabase/ssr` uses __dirname internally which is unavailable in Edge Runtime.
 * Therefore, we do NOT import @supabase/ssr here.
 *
 * We perform a lightweight cookie presence check to handle redirects.
 * The actual auth validation (session integrity, active status, role) is
 * enforced in the dashboard layout Server Component (Node.js runtime).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhooks: no auth required
  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/login");

  // Detect Supabase session by looking for the auth token cookie.
  // @supabase/ssr stores it as: sb-<projectRef>-auth-token[.0, .1, ...]
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  // Not authenticated → redirect to login
  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated + visiting login → redirect to leads
  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/leads";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
