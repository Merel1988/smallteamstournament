"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { uploadToBlob, deleteFromBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPlayer(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  const name = String(formData.get("name") || "").trim();
  const number = String(formData.get("number") || "").trim();
  if (!teamId || !name || !number) return;

  const derbyName = String(formData.get("derbyName") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;
  const headshot = formData.get("headshot") as File | null;

  let headshotUrl: string | null = null;
  if (headshot && headshot.size > 0) {
    headshotUrl = await uploadToBlob(headshot, "players");
  }

  await prisma.player.create({
    data: { teamId, name, number, derbyName, position, headshotUrl },
  });
  revalidatePath("/admin/spelers");
  revalidatePath(`/teams/${teamId}`);
}

export async function updatePlayer(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const number = String(formData.get("number") || "").trim();
  if (!name || !number) return;

  const derbyName = String(formData.get("derbyName") || "").trim() || null;
  const position = String(formData.get("position") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "");
  const headshot = formData.get("headshot") as File | null;

  const data: {
    name: string;
    number: string;
    derbyName: string | null;
    position: string | null;
    teamId?: string;
    headshotUrl?: string;
  } = { name, number, derbyName, position };

  if (teamId) data.teamId = teamId;
  if (headshot && headshot.size > 0) {
    data.headshotUrl = await uploadToBlob(headshot, "players");
  }

  const player = await prisma.player.update({ where: { id }, data });
  revalidatePath("/admin/spelers");
  revalidatePath(`/teams/${player.teamId}`);
}

export async function deletePlayer(id: string) {
  await requireAdmin();
  const player = await prisma.player.findUnique({ where: { id } });
  if (player?.headshotUrl) await deleteFromBlob(player.headshotUrl);
  await prisma.player.delete({ where: { id } });
  revalidatePath("/admin/spelers");
  if (player) revalidatePath(`/teams/${player.teamId}`);
}
