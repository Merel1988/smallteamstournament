"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { deleteFromBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import {
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  TEAM_COOKIE,
  canEditTeam,
  createTeamToken,
  teamCookieOptions,
  verifyPassword,
} from "@/lib/team-auth";
import {
  LIMITS,
  MAX_BENCH,
  MAX_PLAYERS,
  isTeamHeadshotUrl,
  type SaveResult,
} from "@/lib/team-portal";

function text(formData: FormData, key: string, max: number): string | null {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > max) return null;
  return value;
}

function refresh(teamId: string) {
  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/admin/spelers");
}

export async function loginTeam(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const locale = String(formData.get("locale") ?? "nl");
  const password = String(formData.get("password") ?? "");
  const back = (error?: string) =>
    redirect({
      href: error ? `/team/${teamId}?error=${error}` : `/team/${teamId}`,
      locale,
    });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team?.password) return back("closed");
  if (team.lockedUntil && team.lockedUntil > new Date()) return back("locked");

  if (!verifyPassword(password, team.password)) {
    const failed = team.failedLogins + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await prisma.team.update({
      where: { id: teamId },
      data: {
        failedLogins: lock ? 0 : failed,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    return back(lock ? "locked" : "wrong");
  }

  if (team.failedLogins > 0 || team.lockedUntil) {
    await prisma.team.update({
      where: { id: teamId },
      data: { failedLogins: 0, lockedUntil: null },
    });
  }
  const store = await cookies();
  store.set(TEAM_COOKIE, createTeamToken(teamId, team.password), teamCookieOptions());
  return back();
}

export async function logoutTeam(teamId: string, locale: string) {
  const store = await cookies();
  store.delete(TEAM_COOKIE);
  redirect({ href: `/team/${teamId}`, locale });
}

export async function savePlayer(
  teamId: string,
  playerId: string | null,
  formData: FormData,
): Promise<SaveResult> {
  if (!(await canEditTeam(teamId))) return { ok: false, error: "forbidden" };

  const derbyName = text(formData, "derbyName", LIMITS.derbyName);
  const number = text(formData, "number", LIMITS.number);
  const pronouns = text(formData, "pronouns", LIMITS.pronouns);
  const headshotUrl = String(formData.get("headshotUrl") ?? "");
  if (!derbyName || !number || pronouns === null) {
    return { ok: false, error: "invalid" };
  }
  if (headshotUrl && !isTeamHeadshotUrl(headshotUrl, teamId)) {
    return { ok: false, error: "invalid" };
  }

  const data = {
    derbyName,
    number,
    pronouns: pronouns || null,
    ...(headshotUrl ? { headshotUrl } : {}),
  };

  if (playerId) {
    const existing = await prisma.player.findUnique({ where: { id: playerId } });
    if (!existing || existing.teamId !== teamId) {
      return { ok: false, error: "forbidden" };
    }
    await prisma.player.update({ where: { id: playerId }, data });
    if (headshotUrl && existing.headshotUrl && existing.headshotUrl !== headshotUrl) {
      await deleteFromBlob(existing.headshotUrl);
    }
  } else {
    const count = await prisma.player.count({ where: { teamId } });
    if (count >= MAX_PLAYERS) return { ok: false, error: "full" };
    await prisma.player.create({ data: { ...data, teamId } });
  }
  refresh(teamId);
  return { ok: true };
}

export async function deletePlayer(teamId: string, playerId: string): Promise<SaveResult> {
  if (!(await canEditTeam(teamId))) return { ok: false, error: "forbidden" };
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.teamId !== teamId) return { ok: false, error: "forbidden" };
  await prisma.player.delete({ where: { id: playerId } });
  if (player.headshotUrl) await deleteFromBlob(player.headshotUrl);
  refresh(teamId);
  return { ok: true };
}

export async function saveBench(
  teamId: string,
  benchId: string | null,
  formData: FormData,
): Promise<SaveResult> {
  if (!(await canEditTeam(teamId))) return { ok: false, error: "forbidden" };

  const name = text(formData, "name", LIMITS.name);
  const role = text(formData, "role", LIMITS.role);
  const pronouns = text(formData, "pronouns", LIMITS.pronouns);
  const headshotUrl = String(formData.get("headshotUrl") ?? "");
  if (!name || !role || pronouns === null) return { ok: false, error: "invalid" };
  if (headshotUrl && !isTeamHeadshotUrl(headshotUrl, teamId)) {
    return { ok: false, error: "invalid" };
  }

  const data = {
    name,
    role,
    pronouns: pronouns || null,
    ...(headshotUrl ? { headshotUrl } : {}),
  };
  if (benchId) {
    const existing = await prisma.benchStaff.findUnique({ where: { id: benchId } });
    if (!existing || existing.teamId !== teamId) {
      return { ok: false, error: "forbidden" };
    }
    await prisma.benchStaff.update({ where: { id: benchId }, data });
    if (headshotUrl && existing.headshotUrl && existing.headshotUrl !== headshotUrl) {
      await deleteFromBlob(existing.headshotUrl);
    }
  } else {
    const count = await prisma.benchStaff.count({ where: { teamId } });
    if (count >= MAX_BENCH) return { ok: false, error: "full" };
    await prisma.benchStaff.create({ data: { ...data, teamId, sortOrder: count } });
  }
  refresh(teamId);
  return { ok: true };
}

export async function deleteBench(teamId: string, benchId: string): Promise<SaveResult> {
  if (!(await canEditTeam(teamId))) return { ok: false, error: "forbidden" };
  const existing = await prisma.benchStaff.findUnique({ where: { id: benchId } });
  if (!existing || existing.teamId !== teamId) return { ok: false, error: "forbidden" };
  await prisma.benchStaff.delete({ where: { id: benchId } });
  if (existing.headshotUrl) await deleteFromBlob(existing.headshotUrl);
  refresh(teamId);
  return { ok: true };
}
