// Shared between the score API and the live scorer: no Prisma imports here.

export type LiveScore = {
  id: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
};

export type LiveMatch = LiveScore & {
  startsAt: string;
  poule: string | null;
  teamA: string;
  teamB: string;
};

export type ScoreOp =
  | { key: string; matchId: string; action: "add"; side: "A" | "B"; delta: number }
  | { key: string; matchId: string; action: "set"; scoreA: number; scoreB: number }
  | { key: string; matchId: string; action: "status"; status: string; notify?: boolean };

export function applyOp<T extends LiveScore>(match: T, op: ScoreOp): T {
  if (op.matchId !== match.id) return match;
  switch (op.action) {
    case "add": {
      const field = op.side === "A" ? "scoreA" : "scoreB";
      return { ...match, [field]: Math.max(0, (match[field] ?? 0) + op.delta) };
    }
    case "set":
      return { ...match, scoreA: op.scoreA, scoreB: op.scoreB };
    case "status":
      return {
        ...match,
        status: op.status,
        ...(op.status === "live" ? { scoreA: match.scoreA ?? 0, scoreB: match.scoreB ?? 0 } : {}),
      };
  }
}
