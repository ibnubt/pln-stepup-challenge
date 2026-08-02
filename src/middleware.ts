import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const authed = req.cookies.get(AUTH_COOKIE)?.value === "1";
  const path = req.nextUrl.pathname;
  // route publik (tanpa login): /login + layar display/kiosk untuk monitor
  const isPublic = path === "/login" || path.startsWith("/display") || path.startsWith("/kiosk");

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (authed && path === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // proteksi semua route kecuali aset statis & _next
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
