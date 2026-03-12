import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that are always public (no session required)
const PUBLIC_PREFIXES = ["/auth", "/_next", "/api", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets through
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for either an authenticated or guest session cookie
  const session = request.cookies.get("cyber-hci-session");
  if (!session) {
    const loginUrl = new URL("/auth", request.url);
    // Preserve the intended destination so we can redirect back after sign-in
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
