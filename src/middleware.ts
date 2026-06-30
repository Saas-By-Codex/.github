import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware: a fast first line of defense that redirects unauthenticated
 * users away from protected pages by checking for the Auth.js session cookie.
 *
 * This is intentionally lightweight (no DB/Prisma at the edge). Authoritative
 * authorization still happens in the dashboard layout (server) and in every API
 * route via `withApi` + RBAC — middleware only short-circuits the obvious case.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vehicles",
  "/charging",
  "/battery",
  "/maintenance",
  "/drivers",
  "/esg",
  "/integrations",
  "/settings",
  "/admin",
];

// Auth.js v5 cookie names (secure prefix in production).
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on app routes only; skip static assets and API (API self-guards).
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/charging/:path*",
    "/battery/:path*",
    "/maintenance/:path*",
    "/drivers/:path*",
    "/esg/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
