import { cookies } from "next/headers";
import { randomUUID, createHash } from "crypto";

const VOTER_COOKIE = "voter_id";

export async function getOrCreateVoterId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing) return existing;
  const fresh = randomUUID();
  store.set(VOTER_COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return fresh;
}

export function voterHash(voterId: string, matchId: string): string {
  return createHash("sha256").update(`${voterId}::${matchId}`).digest("hex");
}
