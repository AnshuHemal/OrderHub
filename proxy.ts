import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session_token")?.value;
  const { pathname }  = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

const PROTECTED_PREFIXES = ["/dashboard", "/pos", "/kitchen", "/admin", "/settings"];
const AUTH_ROUTES        = ["/login", "/signup", "/verify-email", "/forgot-password"];
