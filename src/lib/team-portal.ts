export const LIMITS = {
  derbyName: 60,
  number: 6,
  pronouns: 30,
  name: 80,
  role: 40,
  bio: 1000,
} as const;

export const MAX_PLAYERS = 10;
export const MAX_BENCH = 2;

export const BENCH_ROLES = ["Bench Coach", "Bench Manager", "Alternate"];

export function headshotPrefix(teamId: string): string {
  return `players/${teamId}/`;
}

// Only accept headshots that our own upload route put in this team's folder.
export function isTeamHeadshotUrl(url: string, teamId: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith(`/${headshotPrefix(teamId)}`)
    );
  } catch {
    return false;
  }
}

export type SaveResult = { ok: true } | { ok: false; error: "invalid" | "forbidden" | "full" };
