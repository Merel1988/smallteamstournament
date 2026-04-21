import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return Response.redirect(url, 303);
}
