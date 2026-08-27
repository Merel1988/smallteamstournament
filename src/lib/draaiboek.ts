import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { EVENT } from "@/lib/event";
import type { Area, InfoItem, ItemDTO, DraaiboekState, Role } from "@/lib/draaiboek-types";
import { AREAS, GAME_MINUTES, PRE_GAME_MARGIN, POST_GAME_MARGIN } from "@/lib/draaiboek-types";

export * from "@/lib/draaiboek-types";
import { DEFAULT_ITEMS, DEFAULT_TASKS, toMinutes } from "@/lib/draaiboek-seed";


function same(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Two unlisted links: DRAAIBOEK_TOKEN is shared with volunteers,
// DRAAIBOEK_ORG_TOKEN with the organisation (unlocks the extra tabs).
export function roleForToken(candidate: string | null | undefined): Role | null {
  if (!candidate) return null;
  if (same(process.env.DRAAIBOEK_ORG_TOKEN, candidate)) return "organisatie";
  if (same(process.env.DRAAIBOEK_TOKEN, candidate)) return "vrijwilliger";
  return null;
}

async function seedIfEmpty(): Promise<void> {
  if ((await prisma.draaiboekItem.count()) === 0) {
    let o = 0;
    for (const i of DEFAULT_ITEMS) {
      await prisma.draaiboekItem.create({
        data: { kind: i.kind, fase: i.fase ?? "", text: i.text, note: i.note ?? "", sortOrder: o++ },
      });
    }
  }
  const count = await prisma.volunteerTask.count();
  if (count > 0) return;
  let order = 0;
  for (const t of DEFAULT_TASKS) {
    await prisma.volunteerTask.create({
      data: {
        area: t.area,
        name: t.name,
        info: JSON.stringify((t.info ?? []).map((text) => ({ text, done: false }))),
        sortOrder: order++,
        shifts: {
          create: t.shifts.map(([from, to, need]) => ({
            start: toMinutes(from),
            end: toMinutes(to),
            need,
          })),
        },
      },
    });
  }
}

// Minutes since local midnight on event day (Europe/Amsterdam).
function localMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

// Days until the event, computed outside render (server helper).
export function daysToEvent(): number {
  return Math.max(0, Math.ceil((EVENT.date.getTime() - Date.now()) / 86400000));
}

export async function loadState(): Promise<DraaiboekState> {
  await seedIfEmpty();
  const [tasks, volunteers, teams, matches, items] = await Promise.all([
    prisma.volunteerTask.findMany({
      orderBy: { sortOrder: "asc" },
      include: { shifts: { include: { signups: true }, orderBy: { start: "asc" } } },
    }),
    prisma.volunteer.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.match.findMany({
      select: { id: true, startsAt: true, teamAId: true, teamBId: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.draaiboekItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    items: items.map((i) => ({
      id: i.id,
      kind: (["prep", "issue", "role"].includes(i.kind) ? i.kind : "issue") as ItemDTO["kind"],
      fase: i.fase,
      text: i.text,
      note: i.note,
      wie: i.wie,
      datum: i.datum,
      done: i.done,
      sortOrder: i.sortOrder,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      area: (t.area in AREAS ? t.area : "algemeen") as Area,
      name: t.name,
      info: safeJson(t.info),
      sortOrder: t.sortOrder,
      shifts: t.shifts.map((s) => ({
        id: s.id,
        taskId: t.id,
        start: s.start,
        end: s.end,
        need: s.need,
        who: s.signups.map((x) => x.volunteerId),
      })),
    })),
    volunteers: volunteers.map((v) => ({ id: v.id, name: v.name, teamId: v.teamId })),
    teams,
    games: matches.map((m) => {
      const start = localMinutes(m.startsAt);
      return { id: m.id, start, end: start + GAME_MINUTES, teamAId: m.teamAId, teamBId: m.teamBId };
    }),
    pre: PRE_GAME_MARGIN,
    post: POST_GAME_MARGIN,
  };
}

export function safeJson(s: string): InfoItem[] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v.map((x) =>
      typeof x === "string" ? { text: x, done: false } : { text: String(x.text ?? ""), done: !!x.done },
    );
  } catch {
    return [];
  }
}
