import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  USER_COOKIE,
  parseSessionUserCookie,
} from "@/lib/session-user";
import { canAccessPath, defaultRouteForNivel } from "@/lib/permissions";

function homeForRequest(request: NextRequest): string {
  const user = parseSessionUserCookie(
    request.cookies.get(USER_COOKIE)?.value,
  );
  if (!user) return "/dashboard";
  return defaultRouteForNivel(user.nivel);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.get(SESSION_COOKIE)?.value === "1";
  const home = homeForRequest(request);

  if (pathname === "/login") {
    if (authed) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authed ? home : "/login", request.url),
    );
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = parseSessionUserCookie(request.cookies.get(USER_COOKIE)?.value);
  if (user && !canAccessPath(user.nivel, pathname)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif)).*)",
  ],
};
