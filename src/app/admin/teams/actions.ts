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
  const description = String(formData.get("description") || "").trim() || null;
  const logo = formData.get("logo") as File | null;

  let logoUrl: string | null = null;
  if (logo && logo.size > 0) {
    logoUrl = await uploadToBlob(logo, "teams");
  }

  await prisma.team.create({
    data: { name, shortName, color, description, logoUrl },
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
  const description = String(formData.get("description") || "").trim() || null;
  const logo = formData.get("logo") as File | null;

  const data: {
    name: string;
    shortName: string | null;
    color: string | null;
    description: string | null;
    logoUrl?: string;
  } = { name, shortName, color, description };

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
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/teams");
  revalidatePath("/teams");
}
