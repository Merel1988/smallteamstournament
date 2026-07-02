"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { uploadToBlob, deleteFromBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const shortName = String(formData.get("shortName") || "").trim() || null;
  const color = String(formData.get("color") || "").trim() || null;
  const descriptionNl = String(formData.get("descriptionNl") || "").trim() || null;
  const descriptionEn = String(formData.get("descriptionEn") || "").trim() || null;
  const logo = formData.get("logo") as File | null;

  let logoUrl: string | null = null;
  if (logo && logo.size > 0) {
    logoUrl = await uploadToBlob(logo, "teams");
  }

  await prisma.team.create({
    data: { name, shortName, color, descriptionNl, descriptionEn, logoUrl },
  });
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const shortName = String(formData.get("shortName") || "").trim() || null;
  const color = String(formData.get("color") || "").trim() || null;
  const descriptionNl = String(formData.get("descriptionNl") || "").trim() || null;
  const descriptionEn = String(formData.get("descriptionEn") || "").trim() || null;
  const logo = formData.get("logo") as File | null;

  const data: {
    name: string;
    shortName: string | null;
    color: string | null;
    descriptionNl: string | null;
    descriptionEn: string | null;
    logoUrl?: string;
  } = { name, shortName, color, descriptionNl, descriptionEn };

  if (logo && logo.size > 0) {
    data.logoUrl = await uploadToBlob(logo, "teams");
  }

  await prisma.team.update({ where: { id }, data });
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
}

export async function deleteTeam(id: string) {
  await requireAdmin();
  const team = await prisma.team.findUnique({ where: { id } });
  if (team?.logoUrl) await deleteFromBlob(team.logoUrl);
  // Match → Team is ON DELETE RESTRICT, so a team that plays in any match can't
  // be deleted directly. Remove its matches first (their MVP votes cascade),
  // then the team (its players and their votes cascade). Atomic so a failure
  // never leaves half-deleted data.
  await prisma.$transaction([
    prisma.match.deleteMany({
      where: { OR: [{ teamAId: id }, { teamBId: id }] },
    }),
    prisma.team.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath("/schema");
}
