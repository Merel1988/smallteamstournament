import {
  ADMIN_COOKIE,
  checkPassword,
  cookieOptions,
  createToken,
  scorerMayAccess,
  SCORER_HOME,
} from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/admin");

  const role = checkPassword(password);
  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "1");
    if (next !== "/admin") url.searchParams.set("next", next);
    return Response.redirect(url, 303);
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, createToken(role), cookieOptions());

  const redirectUrl = request.nextUrl.clone();
  if (role === "scorer") {
    redirectUrl.pathname = scorerMayAccess(next) ? next : SCORER_HOME;
  } else {
    redirectUrl.pathname = next.startsWith("/admin") ? next : "/admin";
  }
  redirectUrl.search = "";
  return Response.redirect(redirectUrl, 303);
}
