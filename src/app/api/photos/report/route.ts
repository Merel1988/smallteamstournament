import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    reason?: unknown;
  } | null;
  if (!body || typeof body.id !== "string") {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : null;

  await prisma.photo.updateMany({
    where: { id: body.id, reportedAt: null },
    data: { reportedAt: new Date(), reportReason: reason },
  });
  return Response.json({ ok: true });
}
