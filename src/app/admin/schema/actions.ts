"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMatch(formData: FormData) {
  await requireAdmin();
  const startsAt = new Date(String(formData.get("startsAt")));
  const teamAId = String(formData.get("teamAId") || "");
  const teamBId = String(formData.get("teamBId") || "");
  if (!teamAId || !teamBId || Number.isNaN(startsAt.getTime())) return;
  const poule = String(formData.get("poule") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.match.create({
    data: { startsAt, teamAId, teamBId, poule, notes, status: "scheduled" },
  });
  revalidatePath("/admin/schema");
  revalidatePath("/schema");
  revalidatePath("/");
}

export async function updateMatch(id: string, formData: FormData) {
  await requireAdmin();
  const startsAt = new Date(String(formData.get("startsAt")));
  const scoreA = formData.get("scoreA");
  const scoreB = formData.get("scoreB");
  const status = String(formData.get("status") || "scheduled");
  const poule = String(formData.get("poule") || "").trim() || null;

  await prisma.match.update({
    where: { id },
    data: {
      startsAt: Number.isNaN(startsAt.getTime()) ? undefined : startsAt,
      scoreA: scoreA === "" || scoreA == null ? null : Number(scoreA),
      scoreB: scoreB === "" || scoreB == null ? null : Number(scoreB),
      status,
      poule,
    },
  });
  revalidatePath("/admin/schema");
  revalidatePath("/schema");
  revalidatePath("/");
  revalidatePath("/mvp");
}

export async function deleteMatch(id: string) {
  await requireAdmin();
  await prisma.match.delete({ where: { id } });
  revalidatePath("/admin/schema");
  revalidatePath("/schema");
}
