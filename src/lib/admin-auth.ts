import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "derby_admin";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 uur

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not set");
  return secret;
}

export function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export type AdminRole = "admin" | "scorer";

export function verify(token: string | undefined): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const providedHmac = token.slice(lastDot + 1);
  try {
    const expectedHmac = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    const a = Buffer.from(expectedHmac, "hex");
    const b = Buffer.from(providedHmac, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function roleOf(token: string | undefined): AdminRole | null {
  if (!token || !verify(token)) return null;
  const prefix = token.slice(0, token.indexOf("."));
  return prefix === "admin" || prefix === "scorer" ? prefix : null;
}

function matches(expected: string | undefined, input: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(input);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(input: string): AdminRole | null {
  if (matches(process.env.ADMIN_PASSWORD, input)) return "admin";
  if (matches(process.env.SCORER_PASSWORD, input)) return "scorer";
  return null;
}

export function createToken(role: AdminRole): string {
  const issuedAt = Date.now();
  return sign(`${role}.${issuedAt}`);
}

export const SCORER_HOME = "/admin/live";

export function scorerMayAccess(pathname: string): boolean {
  return pathname === SCORER_HOME || pathname.startsWith(`${SCORER_HOME}/`);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

export async function getRole(): Promise<AdminRole | null> {
  const store = await cookies();
  return roleOf(store.get(ADMIN_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === "admin";
}

export async function canScore(): Promise<boolean> {
  return (await getRole()) !== null;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
}

export async function requireScorer(): Promise<void> {
  if (!(await canScore())) {
    redirect("/admin/login");
  }
}
