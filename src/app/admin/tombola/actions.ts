"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parsePrizeLines, ticketKey } from "@/lib/tombola";

function refresh() {
  revalidatePath("/admin/tombola");
  revalidatePath("/tombola");
}

export async function addPrizes(formData: FormData) {
  await requireAdmin();
  const rows = parsePrizeLines(String(formData.get("lines") ?? ""));
  for (const { ticket, prize } of rows) {
    const key = ticketKey(ticket);
    await prisma.tombolaPrize.upsert({
      where: { ticketKey: key },
      create: { ticket, ticketKey: key, prize },
      update: { ticket, prize },
    });
  }
  refresh();
}

export async function toggleClaimed(id: string) {
  await requireAdmin();
  const prize = await prisma.tombolaPrize.findUnique({ where: { id } });
  if (!prize) return;
  await prisma.tombolaPrize.update({ where: { id }, data: { claimedAt: prize.claimedAt ? null : new Date() } });
  refresh();
}

export async function deletePrize(id: string) {
  await requireAdmin();
  await prisma.tombolaPrize.delete({ where: { id } }).catch(() => null);
  refresh();
}
