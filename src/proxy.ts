import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { verify, ADMIN_COOKIE } from "@/lib/admin-auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!pathname.startsWith("/admin/login")) {
      const token = request.cookies.get(ADMIN_COOKIE)?.value;
      if (!verify(token)) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
