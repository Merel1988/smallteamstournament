import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const TEAM_COOKIE = "derby_team";
const TEAM_SESSION_SECONDS = 60 * 60 * 24 * 30;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

// Separate HMAC key from the admin cookie, so a team token can never pass as an admin token.
function key(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not set");
  return `${secret}:team-portal`;
}

function hmac(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Tied to the current hash, so changing or removing the password ends existing sessions.
function passwordFingerprint(passwordHash: string): string {
  return hmac(`fp.${passwordHash}`).slice(0, 16);
}

export function createTeamToken(teamId: string, passwordHash: string): string {
  const payload = `team.${teamId}.${passwordFingerprint(passwordHash)}.${Date.now()}`;
  return `${payload}.${hmac(payload)}`;
}

function readToken(token: string | undefined) {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const payload = token.slice(0, lastDot);
  const a = Buffer.from(hmac(payload), "hex");
  const b = Buffer.from(token.slice(lastDot + 1), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [kind, teamId, fingerprint, issuedAt] = payload.split(".");
  if (kind !== "team" || !teamId || !fingerprint) return null;
  if (Date.now() - Number(issuedAt) > TEAM_SESSION_SECONDS * 1000) return null;
  return { teamId, fingerprint };
}

export function teamCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEAM_SESSION_SECONDS,
  };
}

export async function canEditTeam(teamId: string): Promise<boolean> {
  if (await isAdmin()) return true;
  const store = await cookies();
  const session = readToken(store.get(TEAM_COOKIE)?.value);
  if (!session || session.teamId !== teamId) return false;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { passwordHash: true },
  });
  if (!team?.passwordHash) return false;
  return session.fingerprint === passwordFingerprint(team.passwordHash);
}

export async function requireTeamEditor(teamId: string): Promise<void> {
  if (!(await canEditTeam(teamId))) throw new Error("Not allowed");
}
