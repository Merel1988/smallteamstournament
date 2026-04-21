import { prisma } from "@/lib/prisma";
import { getOrCreateVoterId, voterHash } from "@/lib/voter-id";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { matchId, playerId } = await req.json();
  if (!matchId || !playerId) {
    return Response.json({ error: "Missing matchId or playerId" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return Response.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "finished") {
    return Response.json(
      { error: "Stemmen is pas mogelijk als de wedstrijd afgelopen is." },
      { status: 400 },
    );
  }

  const voterId = await getOrCreateVoterId();
  const hash = voterHash(voterId, matchId);

  try {
    await prisma.mvpVote.upsert({
      where: { voterHash_matchId: { voterHash: hash, matchId } },
      update: { playerId },
      create: { matchId, playerId, voterHash: hash },
    });
  } catch {
    await prisma.mvpVote.create({
      data: { matchId, playerId, voterHash: hash },
    });
  }

  return Response.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return Response.json({ error: "missing matchId" }, { status: 400 });

  const votes = await prisma.mvpVote.groupBy({
    by: ["playerId"],
    where: { matchId },
    _count: { playerId: true },
  });
  return Response.json({ votes });
}
