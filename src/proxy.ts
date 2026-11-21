import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { roleOf, scorerMayAccess, ADMIN_COOKIE, SCORER_HOME } from "@/lib/admin-auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!pathname.startsWith("/admin/login")) {
      const role = roleOf(request.cookies.get(ADMIN_COOKIE)?.value);
      if (!role) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      if (role === "scorer" && !scorerMayAccess(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = SCORER_HOME;
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/draaiboek")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
