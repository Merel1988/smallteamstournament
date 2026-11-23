"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { EditionStats as Stats, GameStats, SkaterBoard, SkaterBoardKey, TeamStats } from "@/lib/edition-types";
import { BarList, Pills, Tile, type BarRow } from "./StatBars";

type TeamInfo = { key: string; name: string };
type Tab = "overview" | "skaters" | "teams" | "games" | "penalties";
type TeamCol = Exclude<keyof TeamStats, "team">;
type GameSort = "order" | "closest" | "margin" | "jams" | "penalties";
type CompareKey = "avgMargin" | "leadPct" | "pointsPerJam" | "penaltiesPerGame" | "timeToLead";

const TEAM_COLS: TeamCol[] = [
  "games", "won", "lost", "pointsFor", "pointsAgainst", "avgMargin", "jams",
  "leadPct", "pointsPerJam", "starPasses", "penalties", "penaltiesPerGame", "timeToLead",
];
const ASCENDING_IS_BETTER: TeamCol[] = ["lost", "pointsAgainst", "penalties", "penaltiesPerGame", "timeToLead"];
const ratio = (g: GameStats) => Math.max(g.scoreA, g.scoreB) / Math.max(1, Math.min(g.scoreA, g.scoreB));
const margin = (g: GameStats) => Math.abs(g.scoreA - g.scoreB);

export default function EditionStats({
  stats,
  teams,
  playerNames,
}: {
  stats: Stats;
  teams: TeamInfo[];
  playerNames: Record<string, string>;
}) {
  const t = useTranslations("Editions.Stats");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("overview");
  const [team, setTeam] = useState<string>("all");
  const [board, setBoard] = useState<SkaterBoardKey>("points");
  const [sort, setSort] = useState<{ col: TeamCol; desc: boolean }>({ col: "won", desc: true });
  const [compare, setCompare] = useState<CompareKey>("avgMargin");
  const [gameSort, setGameSort] = useState<GameSort>("order");

  const nf = useMemo(() => {
    const make = (d: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
    return { 0: make(0), 1: make(1), 2: make(2) };
  }, [locale]);

  const teamName = (key: string) => teams.find((x) => x.key === key)?.name ?? key;
  const skaterName = (teamKey: string, number: string) => playerNames[`${teamKey}:${number}`] ?? `#${number}`;
  const filtered = team !== "all";
  const dimmed = (teamKey: string) => filtered && teamKey !== team;

  function formatValue(format: SkaterBoard["format"], v: number): string {
    switch (format) {
      case "int":
        return nf[0].format(v);
      case "dec2":
        return nf[2].format(v);
      case "pct":
        return `${nf[1].format(v)}%`;
      case "plus":
        return `${v > 0 ? "+" : ""}${nf[2].format(v)}`;
      case "seconds":
        return t("seconds", { value: nf[1].format(v) });
    }
  }

  function formatTeamCol(col: TeamCol, v: number): string {
    if (col === "avgMargin") return `${v > 0 ? "+" : ""}${nf[1].format(v)}`;
    if (col === "leadPct") return `${nf[1].format(v)}%`;
    if (col === "pointsPerJam") return nf[2].format(v);
    if (col === "penaltiesPerGame") return nf[1].format(v);
    if (col === "timeToLead") return t("seconds", { value: nf[1].format(v) });
    return nf[0].format(v);
  }

  const skaterLabel = (teamKey: string, number: string) => (
    <>
      <span className="text-derby-ink/60 font-normal">#{number}</span> {skaterName(teamKey, number)}
    </>
  );

  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: t("tabOverview") },
    { value: "skaters", label: t("tabSkaters") },
    { value: "teams", label: t("tabTeams") },
    { value: "games", label: t("tabGames") },
    { value: "penalties", label: t("tabPenalties") },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-bold" id="stats-filter-label">
          {t("filterLabel")}
        </p>
        <div role="group" aria-labelledby="stats-filter-label" className="flex flex-wrap gap-1.5">
          {[{ key: "all", name: t("allTeams") }, ...teams].map((x) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={team === x.key}
              onClick={() => setTeam(x.key)}
              className={`rounded-full px-3 py-1 text-sm transition border ${
                team === x.key
                  ? "bg-derby-accent text-white border-derby-accent font-bold"
                  : "bg-white border-derby-ink/15 hover:border-derby-ink/40"
              }`}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label={t("tabOverview")} className="flex gap-1 overflow-x-auto border-b border-derby-ink/10">
        {tabs.map((x) => (
          <button
            key={x.value}
            type="button"
            role="tab"
            id={`stats-tab-${x.value}`}
            aria-selected={tab === x.value}
            aria-controls="stats-panel"
            onClick={() => setTab(x.value)}
            className={`shrink-0 px-3 py-2 text-sm font-bold border-b-2 -mb-px transition ${
              tab === x.value ? "border-derby-accent text-derby-ink" : "border-transparent text-derby-ink/60 hover:text-derby-ink"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="stats-panel" aria-labelledby={`stats-tab-${tab}`} className="space-y-6">
        {tab === "overview" && renderOverview()}
        {tab === "skaters" && renderSkaters()}
        {tab === "teams" && renderTeams()}
        {tab === "games" && renderGames()}
        {tab === "penalties" && renderPenalties()}
      </div>
    </div>
  );

  function renderOverview() {
    const o = stats.overview;
    const boardOf = (key: SkaterBoardKey) => stats.skaterBoards.find((b) => b.key === key)!;
    const top = (key: SkaterBoardKey) => {
      const rows = boardOf(key).rows;
      return rows.filter((r) => r.value === rows[0].value);
    };
    const biggest = [...stats.games].sort((a, b) => margin(b) - margin(a))[0];
    const closest = [...stats.games].sort((a, b) => ratio(a) - ratio(b))[0];
    const minPen = Math.min(...stats.teams.map((x) => x.penaltiesPerGame));
    const cleanest = stats.teams.filter((x) => x.penaltiesPerGame === minPen);
    const gameLine = (g: GameStats) =>
      g.scoreA >= g.scoreB
        ? `${teamName(g.teamA)} ${g.scoreA}-${g.scoreB} ${teamName(g.teamB)}`
        : `${teamName(g.teamB)} ${g.scoreB}-${g.scoreA} ${teamName(g.teamA)}`;
    const names = (rows: { team: string; number: string }[]) =>
      [...new Map(rows.map((r) => [`${r.team}:${r.number}`, skaterName(r.team, r.number)])).values()].join(" & ");

    const records = [
      { label: t("recTopScorer"), main: names(top("points")), sub: t("pointsUnit", { count: top("points")[0].value }) },
      { label: t("recBiggestWin"), main: gameLine(biggest), sub: `+${margin(biggest)}` },
      { label: t("recClosest"), main: gameLine(closest), sub: `+${margin(closest)}` },
      { label: t("recBestJam"), main: names(top("bestJam")), sub: t("pointsUnit", { count: top("bestJam")[0].value }) },
      { label: t("recFastest"), main: names(top("timeToLead")), sub: formatValue("seconds", top("timeToLead")[0].value) },
      {
        label: t("recCleanest"),
        main: cleanest.map((x) => teamName(x.team)).join(" & "),
        sub: t("perGameUnit", { value: nf[1].format(minPen) }),
      },
    ];

    return (
      <>
        {filtered && renderTeamSpotlight()}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Tile label={t("games")} value={nf[0].format(o.games)} />
          <Tile label={t("jams")} value={nf[0].format(o.jams)} />
          <Tile label={t("pointsPerGame")} value={nf[1].format(o.pointsPerGame)} />
          <Tile label={t("penaltiesPerGame")} value={nf[1].format(o.penaltiesPerGame)} />
          <Tile label={t("leadJammerPct")} value={`${o.leadJammerPct}%`} />
          <Tile label={t("starPasses")} value={nf[0].format(o.starPasses)} />
          <Tile label={t("avgJam")} value={o.avgJam} />
        </div>
        <section className="space-y-3">
          <h3 className="font-display text-2xl">{t("recordsHeading")}</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((r) => (
              <div key={r.label} className="rounded-xl border border-derby-ink/10 p-3">
                <div className="text-xs uppercase tracking-wide text-derby-accent font-bold">{r.label}</div>
                <div className="font-bold mt-1">{r.main}</div>
                <div className="text-sm text-derby-ink/70 tabular-nums">{r.sub}</div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderTeamSpotlight() {
    const s = stats.teams.find((x) => x.team === team);
    const appearances = stats.skaterBoards.flatMap((b) =>
      b.rows
        .map((r, i) => ({ ...r, rank: i + 1, board: b }))
        .filter((r) => r.team === team)
        .map((r) => ({ key: `${b.key}-${r.rank}`, ...r })),
    );
    if (!s) return null;
    return (
      <section className="rounded-xl border-2 border-derby-accent p-4 space-y-3">
        <h3 className="font-display text-2xl">{teamName(team)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Tile label={`${t("col.wonLong")} / ${t("col.lostLong")}`} value={`${s.won} / ${s.lost}`} />
          <Tile label={`${t("col.pointsFor")} / ${t("col.pointsAgainst")}`} value={`${s.pointsFor} / ${s.pointsAgainst}`} />
          <Tile label={t("col.leadPct")} value={formatTeamCol("leadPct", s.leadPct)} />
          <Tile label={t("col.pointsPerJam")} value={formatTeamCol("pointsPerJam", s.pointsPerJam)} />
        </div>
        {appearances.length > 0 && (
          <ul className="text-sm space-y-1">
            {appearances.map((a) => (
              <li key={a.key}>
                <span className="font-bold">{skaterName(a.team, a.number)}</span>
                {": "}
                {a.rank}. {t(`boards.${a.board.key}.title`)} ({formatValue(a.board.format, a.value)})
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  function renderSkaters() {
    const current = stats.skaterBoards.find((b) => b.key === board)!;
    const rows: BarRow[] = current.rows.map((r, i) => ({
      id: `${i}`,
      rank: i + 1,
      label: skaterLabel(r.team, r.number),
      sub: (
        <>
          {teamName(r.team)}
          {r.pivotPoints ? `, ${t("pivotNote", { count: r.pivotPoints })}` : ""}
        </>
      ),
      value: r.value,
      display: formatValue(current.format, r.value),
      dim: dimmed(r.team),
    }));
    const none = filtered && !current.rows.some((r) => r.team === team);
    return (
      <>
        <Pills
          label={t("tabSkaters")}
          value={board}
          onChange={setBoard}
          options={stats.skaterBoards.map((b) => ({ value: b.key, label: t(`boards.${b.key}.title`) }))}
        />
        <section className="space-y-3">
          <div>
            <h3 className="font-display text-2xl">{t(`boards.${board}.title`)}</h3>
            <p className="text-sm text-derby-ink/60">{t(`boards.${board}.note`)}</p>
          </div>
          {none && <p className="text-sm font-bold">{t("noSkatersForTeam")}</p>}
          <BarList rows={rows} />
          <p className="text-xs text-derby-ink/60">{t("topListNote")}</p>
        </section>
      </>
    );
  }

  function renderTeams() {
    const sorted = [...stats.teams].sort(
      (a, b) =>
        (sort.desc ? b[sort.col] - a[sort.col] : a[sort.col] - b[sort.col]) ||
        b.won - a.won ||
        b.avgMargin - a.avgMargin,
    );
    const toggle = (col: TeamCol) =>
      setSort((s) => (s.col === col ? { col, desc: !s.desc } : { col, desc: !ASCENDING_IS_BETTER.includes(col) }));
    const compareOptions: CompareKey[] = ["avgMargin", "leadPct", "pointsPerJam", "penaltiesPerGame", "timeToLead"];
    const compareRows: BarRow[] = [...stats.teams]
      .sort((a, b) => (compare === "timeToLead" ? a[compare] - b[compare] : b[compare] - a[compare]))
      .map((x) => ({
        id: x.team,
        label: teamName(x.team),
        value: x[compare],
        display: formatTeamCol(compare, x[compare]),
        dim: dimmed(x.team),
      }));
    const abbr = (col: TeamCol) =>
      col === "games" || col === "won" || col === "lost" ? (
        <abbr title={t(`col.${col}Long`)} className="no-underline">
          {t(`col.${col}`)}
        </abbr>
      ) : (
        t(`col.${col}`)
      );

    return (
      <>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm tabular-nums min-w-[720px]">
            <thead>
              <tr className="text-left text-derby-ink/60">
                <th scope="col" className="px-4 py-2 font-normal">
                  {t("col.team")}
                </th>
                {TEAM_COLS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    aria-sort={sort.col === col ? (sort.desc ? "descending" : "ascending") : undefined}
                    className="px-2 py-2 font-normal text-right"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(col)}
                      className={`hover:text-derby-ink whitespace-nowrap ${sort.col === col ? "text-derby-ink font-bold" : ""}`}
                    >
                      {abbr(col)}
                      {sort.col === col && <span aria-hidden>{sort.desc ? " ↓" : " ↑"}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((x) => (
                <tr
                  key={x.team}
                  className={`border-t border-derby-ink/10 ${
                    team === x.team ? "bg-derby-accent/10" : dimmed(x.team) ? "opacity-40" : ""
                  }`}
                >
                  <th scope="row" className="px-4 py-2 text-left font-bold whitespace-nowrap">
                    {teamName(x.team)}
                  </th>
                  {TEAM_COLS.map((col) => (
                    <td key={col} className={`px-2 py-2 text-right ${sort.col === col ? "font-bold" : ""}`}>
                      {formatTeamCol(col, x[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-derby-ink/60">{t("sortHint")}</p>
        <section className="space-y-3">
          <h3 className="font-display text-2xl">{t("compareHeading")}</h3>
          <Pills
            label={t("compareHeading")}
            value={compare}
            onChange={setCompare}
            options={compareOptions.map((c) => ({ value: c, label: t(`col.${c}`) }))}
          />
          <BarList rows={compareRows} diverging={compare === "avgMargin"} />
        </section>
      </>
    );
  }

  function renderGames() {
    const sorters: Record<GameSort, (a: GameStats, b: GameStats) => number> = {
      order: (a, b) => a.n - b.n,
      closest: (a, b) => ratio(a) - ratio(b),
      margin: (a, b) => margin(b) - margin(a),
      jams: (a, b) => b.jams - a.jams,
      penalties: (a, b) => b.penaltiesA + b.penaltiesB - (a.penaltiesA + a.penaltiesB),
    };
    const games = stats.games.filter((g) => !filtered || g.teamA === team || g.teamB === team).sort(sorters[gameSort]);
    const jamRows: BarRow[] = stats.jamScores.map(([score, count]) => ({
      id: score,
      label: score,
      value: count,
      display: nf[0].format(count),
    }));

    return (
      <>
        <Pills
          label={t("sortLabel")}
          value={gameSort}
          onChange={setGameSort}
          options={(["order", "closest", "margin", "jams", "penalties"] as GameSort[]).map((s) => ({
            value: s,
            label: t(`sort${s[0].toUpperCase()}${s.slice(1)}`),
          }))}
        />
        {games.length === 0 && <p className="text-sm">{t("noGamesForTeam")}</p>}
        <ul className="space-y-2">
          {games.map((g) => {
            const aWon = g.scoreA > g.scoreB;
            return (
              <li key={g.n}>
                <details className="group rounded-xl border border-derby-ink/10 open:border-derby-ink/30">
                  <summary className="cursor-pointer list-none p-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-derby-ink/60 w-24 shrink-0">{t("gameNumber", { n: g.n })}</span>
                    <span className="flex-1 min-w-[14rem] grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <span className={`text-right truncate ${aWon ? "font-bold" : ""}`}>{teamName(g.teamA)}</span>
                      <span className="font-display text-xl tabular-nums whitespace-nowrap">
                        {g.scoreA} - {g.scoreB}
                      </span>
                      <span className={`truncate ${!aWon ? "font-bold" : ""}`}>{teamName(g.teamB)}</span>
                    </span>
                    <span className="text-xs text-derby-ink/60 tabular-nums">
                      +{margin(g)} · {t("gameJams", { count: g.jams })}
                    </span>
                    <span aria-hidden className="text-derby-ink/40 group-open:rotate-180 transition">
                      ▾
                    </span>
                  </summary>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 px-3 pb-3 text-sm">
                    <Fact label={t("gamePenalties")} value={`${g.penaltiesA} - ${g.penaltiesB}`} />
                    <Fact label={t("gameLeadChanges")} value={String(g.leadChanges)} />
                    <Fact label={t("gameDuration")} value={t("minutes", { value: g.minutes })} />
                    <Fact label={t("gameAvgJam")} value={g.avgJam} />
                    <Fact label={t("gameAvgLineup")} value={t("seconds", { value: nf[1].format(g.avgLineup) })} />
                    <Fact label={t("gameTimeouts")} value={String(g.timeouts)} />
                    {g.comeback > 0 && (
                      <p className="col-span-full font-bold text-derby-accent">{t("gameComeback", { points: g.comeback })}</p>
                    )}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
        <section className="space-y-3">
          <div>
            <h3 className="font-display text-2xl">{t("jamScoresHeading")}</h3>
            <p className="text-sm text-derby-ink/60">{t("jamScoresNote")}</p>
          </div>
          <BarList rows={jamRows} />
        </section>
      </>
    );
  }

  function renderPenalties() {
    const total = stats.penaltyCodes.reduce((sum, [, n]) => sum + n, 0);
    const pct = (n: number, of: number) => `${nf[1].format((n / of) * 100)}%`;
    const codeRows: BarRow[] = stats.penaltyCodes.map(([code, n]) => ({
      id: code,
      label: code === "?" ? t("penaltyCodes.unknown") : `${code} · ${t(`penaltyCodes.${code}`)}`,
      value: n,
      display: `${n} (${pct(n, total)})`,
    }));
    const endTotal = stats.jamEndings.reduce((sum, [, n]) => sum + n, 0);
    const endRows: BarRow[] = stats.jamEndings.map(([key, n]) => ({
      id: key,
      label: t(`jamEndings.${key}`),
      value: n,
      display: `${n} (${pct(n, endTotal)})`,
    }));
    const ttlRows: BarRow[] = [...stats.teams]
      .sort((a, b) => a.timeToLead - b.timeToLead)
      .map((x) => ({
        id: x.team,
        label: teamName(x.team),
        value: x.timeToLead,
        display: formatTeamCol("timeToLead", x.timeToLead),
        dim: dimmed(x.team),
      }));
    const penRows: BarRow[] = [...stats.teams]
      .sort((a, b) => b.penaltiesPerGame - a.penaltiesPerGame)
      .map((x) => ({
        id: x.team,
        label: teamName(x.team),
        value: x.penaltiesPerGame,
        display: formatTeamCol("penaltiesPerGame", x.penaltiesPerGame),
        dim: dimmed(x.team),
      }));
    const tm = stats.timing;

    return (
      <>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-display text-2xl">{t("penaltyCodesHeading")}</h3>
            <BarList rows={codeRows} />
          </div>
          <div className="space-y-3">
            <h3 className="font-display text-2xl">{t("col.penaltiesPerGame")}</h3>
            <BarList rows={penRows} />
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="font-display text-2xl">{t("timingHeading")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Tile label={t("avgJam")} value={stats.overview.avgJam} />
            <Tile label={t("medianJam")} value={tm.medianJam} />
            <Tile label={t("medianTimeToLead")} value={tm.medianTimeToLead} />
            <Tile label={t("avgLineup")} value={t("seconds", { value: nf[1].format(tm.avgLineup) })} />
            <Tile label={t("teamTimeouts")} value={String(tm.teamTimeouts)} />
            <Tile label={t("officialTimeouts")} value={String(tm.officialTimeouts)} />
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-display text-2xl">{t("jamEndingsHeading")}</h3>
            <BarList rows={endRows} />
          </div>
          <div className="space-y-3">
            <h3 className="font-display text-2xl">{t("teamTimeToLeadHeading")}</h3>
            <BarList rows={ttlRows} />
          </div>
        </section>
      </>
    );
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-derby-ink/60">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
