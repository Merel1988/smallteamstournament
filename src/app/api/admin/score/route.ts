import { after, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin-auth";
import { sideName } from "@/lib/match-teams";
import { prisma } from "@/lib/prisma";
import { sendToAll } from "@/lib/push";
import type { LiveScore } from "@/lib/live-score";

export const dynamic = "force-dynamic";

const MAX_SCORE = 999;
const MAX_DELTA = 50;
const STATUSES = new Set(["scheduled", "live", "finished"]);
const SELECT = { id: true, scoreA: true, scoreB: true, status: true } as const;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function int(v: unknown, lo: number, hi: number): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

export async function GET() {
  if (!(await isAdmin())) return json({ error: "Niet ingelogd." }, 401);
  const matches: LiveScore[] = await prisma.match.findMany({ select: SELECT });
  return json({ matches });
}

type Body = {
  matchId?: unknown;
  action?: unknown;
  side?: unknown;
  delta?: unknown;
  scoreA?: unknown;
  scoreB?: unknown;
  status?: unknown;
  notify?: unknown;
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return json({ error: "Niet ingelogd." }, 401);
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }
  const id = typeof body.matchId === "string" ? body.matchId : "";
  const current = id
    ? await prisma.match.findUnique({ where: { id }, include: { teamA: true, teamB: true } })
    : null;
  if (!current) return json({ error: "Wedstrijd niet gevonden." }, 404);

  switch (body.action) {
    case "add": {
      const delta = int(body.delta, -MAX_DELTA, MAX_DELTA);
      const field = body.side === "A" ? "scoreA" : body.side === "B" ? "scoreB" : null;
      if (!field || delta == null) return json({ error: "Ongeldige score." }, 400);
      // Increments keep concurrent taps from two phones from overwriting each other.
      await prisma.$transaction([
        prisma.match.updateMany({ where: { id, [field]: null }, data: { [field]: 0 } }),
        prisma.match.update({ where: { id }, data: { [field]: { increment: delta } } }),
        prisma.match.updateMany({ where: { id, [field]: { lt: 0 } }, data: { [field]: 0 } }),
      ]);
      break;
    }
    case "set": {
      const scoreA = int(body.scoreA, 0, MAX_SCORE);
      const scoreB = int(body.scoreB, 0, MAX_SCORE);
      if (scoreA == null || scoreB == null) return json({ error: "Ongeldige score." }, 400);
      await prisma.match.update({ where: { id }, data: { scoreA, scoreB } });
      break;
    }
    case "status": {
      const status = typeof body.status === "string" ? body.status : "";
      if (!STATUSES.has(status)) return json({ error: "Ongeldige status." }, 400);
      await prisma.match.update({ where: { id }, data: { status } });
      if (status === "live") {
        await prisma.match.updateMany({ where: { id, scoreA: null }, data: { scoreA: 0 } });
        await prisma.match.updateMany({ where: { id, scoreB: null }, data: { scoreB: 0 } });
      }
      // Only on the transition, so a retried request never sends the result twice.
      if (status === "finished" && current.status !== "finished" && body.notify === true) {
        const teamA = sideName(current.teamA, current.teamALabel);
        const teamB = sideName(current.teamB, current.teamBLabel);
        after(() =>
          sendToAll({
            title: current.poule ? `Eindstand ${current.poule}` : "Eindstand",
            body: `${teamA} ${current.scoreA ?? 0}-${current.scoreB ?? 0} ${teamB}`,
            url: "/schema",
            tag: `result-${id}`,
          }).catch(() => undefined),
        );
      }
      break;
    }
    default:
      return json({ error: "Onbekende actie." }, 400);
  }

  revalidatePath("/");
  revalidatePath("/schema");
  const match: LiveScore | null = await prisma.match.findUnique({ where: { id }, select: SELECT });
  return json({ match });
}
