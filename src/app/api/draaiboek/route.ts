import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadState, roleForToken, safeJson, AREAS } from "@/lib/draaiboek";

export const dynamic = "force-dynamic";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: NOINDEX });

export async function GET(req: NextRequest) {
  const role = roleForToken(req.nextUrl.searchParams.get("token"));
  if (!role) return json({ error: "Onbekende link." }, 404);
  return json({ role, state: await loadState() });
}

type Body = { token?: string; action?: string } & Record<string, unknown>;
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, lo: number, hi: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : NaN;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Ongeldig verzoek." }, 400);
  }
  const role = roleForToken(body.token);
  if (!role) return json({ error: "Onbekende link." }, 404);
  const org = role === "organisatie";
  let message: string | undefined;

  try {
    switch (body.action) {
      case "addVolunteer": {
        const name = str(body.name, 80);
        if (!name) return json({ error: "Vul een naam in." }, 400);
        const dup = await prisma.volunteer.findFirst({ where: { name } });
        if (dup) return json({ error: "Die naam staat er al, kies hem in de lijst.", id: dup.id }, 409);
        const teamId = str(body.teamId) || null;
        const v = await prisma.volunteer.create({ data: { name, teamId } });
        return json({ role, id: v.id, state: await loadState() });
      }
      case "setVolunteerTeam": {
        const id = str(body.id);
        await prisma.volunteer.update({ where: { id }, data: { teamId: str(body.teamId) || null } });
        break;
      }
      case "signup": {
        const shiftId = str(body.shiftId);
        const volunteerId = str(body.volunteerId);
        const shift = await prisma.volunteerShift.findUnique({
          where: { id: shiftId },
          include: { signups: true },
        });
        if (!shift) return json({ error: "Deze dienst bestaat niet meer." }, 404);
        if (shift.signups.some((s) => s.volunteerId === volunteerId)) break;
        if (shift.signups.length >= shift.need && !org) {
          message = "Deze plek is net door iemand anders gevuld.";
          break;
        }
        await prisma.volunteerSignup.create({ data: { shiftId, volunteerId } });
        break;
      }
      case "unsign": {
        await prisma.volunteerSignup.deleteMany({
          where: { shiftId: str(body.shiftId), volunteerId: str(body.volunteerId) },
        });
        break;
      }
      // ---- organisation only ----
      case "removeVolunteer": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        await prisma.volunteer.delete({ where: { id: str(body.id) } });
        break;
      }
      case "setInfo": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const task = await prisma.volunteerTask.findUnique({ where: { id: str(body.taskId) } });
        if (!task) break;
        const info = safeJson(task.info);
        const i = int(body.index, 0, info.length - 1);
        if (Number.isNaN(i)) break;
        info[i].done = !!body.done;
        await prisma.volunteerTask.update({ where: { id: task.id }, data: { info: JSON.stringify(info) } });
        break;
      }
      case "addTask": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const name = str(body.name, 80);
        if (!name) return json({ error: "Geef de post een naam." }, 400);
        const area = str(body.area) in AREAS ? str(body.area) : "algemeen";
        const from = int(body.from, 0, 1439);
        const to = int(body.to, 0, 1440);
        const need = int(body.need, 1, 30) || 1;
        const split = int(body.split, 0, 600) || 0;
        if (Number.isNaN(from) || Number.isNaN(to) || to <= from)
          return json({ error: "De eindtijd moet na de begintijd liggen." }, 400);
        const shifts: { start: number; end: number; need: number }[] = [];
        if (split > 0) for (let m = from; m < to; m += split) shifts.push({ start: m, end: Math.min(m + split, to), need });
        else shifts.push({ start: from, end: to, need });
        const max = await prisma.volunteerTask.aggregate({ _max: { sortOrder: true } });
        await prisma.volunteerTask.create({
          data: { area, name, info: "[]", sortOrder: (max._max.sortOrder ?? 0) + 1, shifts: { create: shifts } },
        });
        break;
      }
      case "deleteTask": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        await prisma.volunteerTask.delete({ where: { id: str(body.id) } });
        break;
      }
      case "addShift": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const taskId = str(body.taskId);
        const last = await prisma.volunteerShift.findFirst({ where: { taskId }, orderBy: { end: "desc" } });
        const start = last ? last.end : 12 * 60;
        await prisma.volunteerShift.create({
          data: { taskId, start, end: Math.min(start + 120, 1439), need: last?.need ?? 1 },
        });
        break;
      }
      case "updateShift": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const start = int(body.start, 0, 1439);
        const end = int(body.end, 0, 1440);
        const need = int(body.need, 1, 30);
        const data: { start?: number; end?: number; need?: number } = {};
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) Object.assign(data, { start, end });
        if (!Number.isNaN(need)) data.need = need;
        await prisma.volunteerShift.update({ where: { id: str(body.id) }, data });
        break;
      }
      case "deleteShift": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        await prisma.volunteerShift.delete({ where: { id: str(body.id) } });
        break;
      }
      case "setItem": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const patch = (body.patch ?? {}) as Record<string, unknown>;
        const data: Record<string, unknown> = {};
        if ("done" in patch) data.done = !!patch.done;
        if ("wie" in patch) data.wie = str(patch.wie, 120);
        if ("datum" in patch) data.datum = str(patch.datum, 20);
        await prisma.draaiboekItem.update({ where: { id: str(body.id) }, data });
        break;
      }
      case "addItem": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        const kind = str(body.kind);
        if (!["prep", "issue", "role"].includes(kind)) return json({ error: "Onbekend soort item." }, 400);
        const text = str(body.text, 300);
        if (!text) return json({ error: "Vul een omschrijving in." }, 400);
        const max = await prisma.draaiboekItem.aggregate({ _max: { sortOrder: true } });
        await prisma.draaiboekItem.create({
          data: { kind, fase: str(body.fase, 60), text, note: str(body.note, 300), sortOrder: (max._max.sortOrder ?? 0) + 1 },
        });
        break;
      }
      case "deleteItem": {
        if (!org) return json({ error: "Alleen voor de organisatie." }, 403);
        await prisma.draaiboekItem.delete({ where: { id: str(body.id) } });
        break;
      }
      default:
        return json({ error: "Onbekende actie." }, 400);
    }
  } catch (e) {
    console.error("draaiboek action failed", body.action, e);
    return json({ error: "Opslaan is niet gelukt. Probeer het nog eens." }, 500);
  }
  return json({ role, message, state: await loadState() });
}
