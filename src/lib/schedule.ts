import { MATCH_MINUTES } from "@/lib/event";

export type MatchStatus = "scheduled" | "live" | "finished";

// Organisers enter breaks and ceremonies as matches; the poule name tells them apart.
export type ItemKind = "match" | "break" | "program";

export function kindOf(poule: string | null): ItemKind {
  if (!poule) return "match";
  if (/pauze|pause|break|uitloop/i.test(poule)) return "break";
  if (/prijs|ceremon|award|opening|warm|deuren|doors|meeting/i.test(poule)) return "program";
  return "match";
}

export type SchedulePlayer = { id: string; derbyName: string; number: string; headshotUrl: string | null };

export type ScheduleTeam = {
  id: string;
  name: string;
  color: string | null;
  players?: SchedulePlayer[];
  placeholder?: boolean;
};

export type ScheduleMatch = {
  id: string;
  start: number;
  end: number;
  poule: string | null;
  teamA: ScheduleTeam;
  teamB: ScheduleTeam;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  kind: ItemKind;
};

export type PouleStyle = "red" | "ink" | "stripes" | "plain";

export type BoardBlock = ScheduleMatch & {
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

export type BoardPause = { start: number; end: number; top: number; height: number };

export type Board = {
  blocks: BoardBlock[];
  pauses: BoardPause[];
  // Piecewise-linear [time, y] mapping, so long gaps can be compressed.
  axis: [number, number][];
  height: number;
};

const MIN = 60_000;
export const PX_PER_MIN = 5;
export const PAUSE_MIN_MINUTES = 10;
const MAX_GAP_MINUTES = 40;

export function toScheduleMatch(m: {
  id: string;
  startsAt: Date;
  poule: string | null;
  teamA: ScheduleTeam;
  teamB: ScheduleTeam;
  teamALabel?: string | null;
  teamBLabel?: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
}): ScheduleMatch {
  const start = m.startsAt.getTime();
  const status: MatchStatus =
    m.status === "live" || m.status === "finished" ? m.status : "scheduled";
  return {
    id: m.id,
    start,
    end: start + MATCH_MINUTES * MIN,
    poule: m.poule,
    teamA: side(m.id, "A", m.teamA, m.teamALabel),
    teamB: side(m.id, "B", m.teamB, m.teamBLabel),
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    status,
    kind: kindOf(m.poule),
  };
}

function side(matchId: string, which: "A" | "B", team: ScheduleTeam, label?: string | null): ScheduleTeam {
  const text = label?.trim();
  if (text) return { id: `${matchId}-${which}`, name: text, color: null, placeholder: true };
  return { id: team.id, name: team.name, color: team.color, players: team.players };
}

const MAX_ITEM_MINUTES = 60;

// Non-match items have no fixed length: they last until the next item starts.
export function fitItemDurations(matches: ScheduleMatch[]): ScheduleMatch[] {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  return sorted.map((m, i) => {
    if (m.kind === "match") return m;
    const next = sorted.slice(i + 1).find((n) => n.start > m.start);
    const end = next ? Math.min(next.start, m.start + MAX_ITEM_MINUTES * MIN) : m.end;
    return { ...m, end };
  });
}

export function pouleStyles(matches: ScheduleMatch[], other: string): Map<string, PouleStyle> {
  const styles = new Map<string, PouleStyle>();
  const cycle: PouleStyle[] = ["red", "ink", "plain"];
  let i = 0;
  for (const m of matches) {
    const key = m.poule || other;
    if (m.kind !== "match" || styles.has(key)) continue;
    styles.set(key, /final/i.test(key) ? "stripes" : cycle[i++ % cycle.length]);
  }
  return styles;
}

export function buildBoard(matches: ScheduleMatch[]): Board {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return { blocks: [], pauses: [], axis: [], height: 0 };

  // Merge overlapping matches into busy spans; the gaps between spans are pauses.
  const spans: { start: number; end: number; items: ScheduleMatch[] }[] = [];
  for (const m of sorted) {
    const last = spans[spans.length - 1];
    if (last && m.start < last.end) {
      last.end = Math.max(last.end, m.end);
      last.items.push(m);
    } else {
      spans.push({ start: m.start, end: m.end, items: [m] });
    }
  }

  const axis: [number, number][] = [];
  const pauses: BoardPause[] = [];
  let y = 0;
  spans.forEach((span, i) => {
    if (i > 0) {
      const prevEnd = spans[i - 1].end;
      const gapMin = (span.start - prevEnd) / MIN;
      const gapHeight = Math.min(gapMin, MAX_GAP_MINUTES) * PX_PER_MIN;
      if (gapMin >= PAUSE_MIN_MINUTES) {
        pauses.push({ start: prevEnd, end: span.start, top: y, height: gapHeight });
      }
      y += gapHeight;
    }
    axis.push([span.start, y]);
    y += ((span.end - span.start) / MIN) * PX_PER_MIN;
    axis.push([span.end, y]);
  });

  const at = (t: number) => yAt(axis, t);
  const blocks: BoardBlock[] = [];
  for (const span of spans) {
    const laneEnds: number[] = [];
    const placed = span.items.map((m) => {
      let lane = laneEnds.findIndex((end) => end <= m.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = m.end;
      return { m, lane };
    });
    for (const { m, lane } of placed) {
      const top = at(m.start);
      blocks.push({ ...m, top, height: at(m.end) - top, lane, lanes: laneEnds.length });
    }
  }

  return { blocks, pauses, axis, height: y };
}

export function yAt(axis: [number, number][], t: number): number {
  if (axis.length === 0) return 0;
  if (t <= axis[0][0]) return axis[0][1];
  for (let i = 1; i < axis.length; i++) {
    const [t1, y1] = axis[i];
    if (t <= t1) {
      const [t0, y0] = axis[i - 1];
      return t1 === t0 ? y1 : y0 + ((t - t0) / (t1 - t0)) * (y1 - y0);
    }
  }
  return axis[axis.length - 1][1];
}

export type StandingRow = {
  team: ScheduleTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type PouleStanding = { poule: string; rows: StandingRow[]; hasDraws: boolean };

// Standings per poule from finished matches with both scores. Poules with a
// single match (e.g. the final) are skipped.
export function buildStandings(matches: ScheduleMatch[], other: string): PouleStanding[] {
  const byPoule = new Map<string, ScheduleMatch[]>();
  for (const m of matches.filter((x) => x.kind === "match" && !x.teamA.placeholder && !x.teamB.placeholder)) {
    const key = m.poule || other;
    byPoule.set(key, [...(byPoule.get(key) ?? []), m]);
  }

  const result: PouleStanding[] = [];
  for (const [poule, items] of byPoule) {
    if (items.length < 2) continue;
    const rows = new Map<string, StandingRow>();
    const row = (team: ScheduleTeam) => {
      if (!rows.has(team.id)) {
        rows.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, pointsFor: 0, pointsAgainst: 0 });
      }
      return rows.get(team.id)!;
    };
    let any = false;
    for (const m of items) {
      const a = row(m.teamA);
      const b = row(m.teamB);
      if (m.status !== "finished" || m.scoreA == null || m.scoreB == null) continue;
      any = true;
      a.played++;
      b.played++;
      a.pointsFor += m.scoreA;
      a.pointsAgainst += m.scoreB;
      b.pointsFor += m.scoreB;
      b.pointsAgainst += m.scoreA;
      if (m.scoreA > m.scoreB) {
        a.won++;
        b.lost++;
      } else if (m.scoreA < m.scoreB) {
        b.won++;
        a.lost++;
      } else {
        a.drawn++;
        b.drawn++;
      }
    }
    if (!any) continue;
    const sortedRows = [...rows.values()].sort(
      (x, y) =>
        y.won - x.won ||
        y.pointsFor - y.pointsAgainst - (x.pointsFor - x.pointsAgainst) ||
        y.pointsFor - x.pointsFor ||
        x.team.name.localeCompare(y.team.name),
    );
    result.push({ poule, rows: sortedRows, hasDraws: sortedRows.some((r) => r.drawn > 0) });
  }
  return result;
}
