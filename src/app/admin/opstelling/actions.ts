"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function toggleSitOut(matchId: string, playerId: string) {
  await requireAdmin();
  const existing = await prisma.matchSitOut.findUnique({
    where: { matchId_playerId: { matchId, playerId } },
  });
  if (existing) {
    await prisma.matchSitOut.delete({ where: { id: existing.id } });
  } else {
    await prisma.matchSitOut.create({ data: { matchId, playerId } });
  }
  revalidatePath("/admin/opstelling");
  revalidatePath("/schema");
}
