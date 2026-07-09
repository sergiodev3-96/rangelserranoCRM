import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhooks: no auth required
  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/login");

  // Extract project ref from SUPABASE_URL to make cookie check specific to this project
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = supabaseUrl.split(".")[0].replace("https://", "");

  // Detect Supabase session by looking for this project's auth token cookie.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(`sb-${projectRef}-`) && c.name.includes("auth-token"));

  // Not authenticated → redirect to login
  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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


