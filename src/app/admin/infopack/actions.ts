"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseMinutes } from "@/lib/time";

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function refresh() {
  revalidatePath("/admin/infopack");
  revalidatePath("/info");
}

function programData(formData: FormData) {
  const start = parseMinutes(String(formData.get("start") ?? ""));
  const titleNl = text(formData, "titleNl");
  if (start == null || !titleNl) return null;
  return {
    start,
    end: parseMinutes(String(formData.get("end") ?? "")),
    titleNl,
    titleEn: text(formData, "titleEn"),
    noteNl: text(formData, "noteNl"),
    noteEn: text(formData, "noteEn"),
  };
}

export async function createProgramItem(formData: FormData) {
  await requireAdmin();
  const data = programData(formData);
  if (!data) return;
  await prisma.programItem.create({ data });
  refresh();
}

export async function updateProgramItem(id: string, formData: FormData) {
  await requireAdmin();
  const data = programData(formData);
  if (!data) return;
  await prisma.programItem.update({ where: { id }, data });
  refresh();
}

export async function deleteProgramItem(id: string) {
  await requireAdmin();
  await prisma.programItem.delete({ where: { id } });
  refresh();
}

function lockerData(formData: FormData) {
  const room = text(formData, "room");
  const labelNl = text(formData, "labelNl");
  if (!room || !labelNl) return null;
  return { room, labelNl, labelEn: text(formData, "labelEn") };
}

export async function createLockerRoom(formData: FormData) {
  await requireAdmin();
  const data = lockerData(formData);
  if (!data) return;
  const sortOrder = await prisma.lockerRoom.count();
  await prisma.lockerRoom.create({ data: { ...data, sortOrder } });
  refresh();
}

export async function updateLockerRoom(id: string, formData: FormData) {
  await requireAdmin();
  const data = lockerData(formData);
  if (!data) return;
  await prisma.lockerRoom.update({ where: { id }, data });
  refresh();
}

export async function deleteLockerRoom(id: string) {
  await requireAdmin();
  await prisma.lockerRoom.delete({ where: { id } });
  refresh();
}

export async function saveRoster(matchId: string, formData: FormData) {
  await requireAdmin();
  const positions = formData.getAll("position").map(String);
  const names = formData.getAll("name").map(String);
  const pronouns = formData.getAll("pronouns").map(String);
  const rows = positions
    .map((position, i) => ({
      matchId,
      position: position.trim(),
      name: (names[i] ?? "").trim(),
      pronouns: (pronouns[i] ?? "").trim() || null,
      sortOrder: i,
    }))
    .filter((r) => r.position && r.name);

  await prisma.$transaction([
    prisma.officialAssignment.deleteMany({ where: { matchId } }),
    prisma.officialAssignment.createMany({ data: rows }),
  ]);
  refresh();
  redirect(`/admin/infopack?match=${encodeURIComponent(matchId)}&saved=1#roster`);
}

export async function copyRoster(matchId: string, formData: FormData) {
  await requireAdmin();
  const sourceId = String(formData.get("source") ?? "");
  if (!sourceId || sourceId === matchId) return;
  const source = await prisma.officialAssignment.findMany({
    where: { matchId: sourceId },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.$transaction([
    prisma.officialAssignment.deleteMany({ where: { matchId } }),
    prisma.officialAssignment.createMany({
      data: source.map(({ position, name, pronouns, sortOrder }) => ({
        matchId,
        position,
        name,
        pronouns,
        sortOrder,
      })),
    }),
  ]);
  refresh();
  redirect(`/admin/infopack?match=${encodeURIComponent(matchId)}&saved=1#roster`);
}
