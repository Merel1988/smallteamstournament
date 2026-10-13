"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  buildBoard,
  yAt,
  type BoardBlock,
  type PouleStyle,
  type ScheduleMatch,
  type SchedulePlayer,
  type ScheduleTeam,
} from "@/lib/schedule";
import { eventTimeFormatter } from "@/lib/time";

const MIN = 60_000;
const REFRESH_MS = 30_000;
const UP_NEXT_WINDOW = 3 * 60 * MIN;

const BLOCK_STYLES: Record<PouleStyle, string> = {
  red: "bg-derby-accent text-white",
  ink: "bg-derby-ink text-white",
  stripes: "stripes text-white",
  plain: "bg-white text-derby-ink ring-1 ring-derby-ink/15",
};

const SWATCH_STYLES: Record<PouleStyle, string> = {
  red: "bg-derby-accent",
  ink: "bg-derby-ink",
  stripes: "stripes",
  plain: "bg-white ring-1 ring-derby-ink/30",
};

function progressOf(m: ScheduleMatch, now: number | null): number {
  if (now == null) return 0;
  return Math.min(1, Math.max(0, (now - m.start) / (m.end - m.start)));
}

export default function ScheduleBoard({
  matches,
  styles,
  locale,
  otherLabel,
  linkTeams,
}: {
  matches: ScheduleMatch[];
  styles: [string, PouleStyle][];
  locale: string;
  otherLabel: string;
  linkTeams: boolean;
}) {
  const t = useTranslations("Schema");
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const board = useMemo(() => buildBoard(matches), [matches]);
  const styleMap = useMemo(() => new Map(styles), [styles]);
  const time = useMemo(() => eventTimeFormatter(locale), [locale]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const first = board.axis[0]?.[0];
  const last = board.axis[board.axis.length - 1]?.[0];

  useEffect(() => {
    if (first == null || last == null) return;
    const id = setInterval(() => {
      const n = Date.now();
      if (n > first - 60 * MIN && n < last + 60 * MIN) router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [first, last, router]);

  const live = matches.filter((m) => m.status === "live");
  const next =
    live.length === 0 && now != null
      ? matches.find(
          (m) => m.status === "scheduled" && m.start > now - 5 * MIN && m.start - now < UP_NEXT_WINDOW,
        )
      : undefined;
  const showNow = now != null && first != null && last != null && now >= first && now <= last;

  return (
    <div className="space-y-8">
      {live.map((m) => (
        <Spotlight key={m.id} match={m} label={t("onTrack")} live linkTeams={linkTeams}>
          <ProgressBar
            progress={progressOf(m, now)}
            label={
              now == null
                ? ""
                : now > m.end
                  ? t("lastJam")
                  : t("progress", {
                      elapsed: Math.max(0, Math.floor((now - m.start) / MIN)),
                      total: Math.round((m.end - m.start) / MIN),
                    })
            }
          />
          <Rosters match={m} heading={t("rosters")} />
        </Spotlight>
      ))}
      {next && now != null && (
        <Spotlight match={next} label={t("upNext")} linkTeams={linkTeams}>
          <p className="text-sm text-white/80">
            {time.format(next.start)} ·{" "}
            {next.start - now <= MIN
              ? t("startingNow")
              : t("startsIn", { minutes: Math.ceil((next.start - now) / MIN) })}
          </p>
        </Spotlight>
      )}

      <section aria-labelledby="board-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 id="board-heading" className="font-display text-3xl">
            {t("boardHeading")}
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {styles.map(([poule, style]) => (
              <li
                key={poule}
                className="flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1 shadow-sm"
              >
                <span className={`w-4 h-4 rounded-full ${SWATCH_STYLES[style]}`} aria-hidden />
                {poule}
              </li>
            ))}
            {board.pauses.length > 0 && (
              <li className="flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1 shadow-sm">
                <span
                  className="w-4 h-4 rounded-full border-2 border-dashed border-derby-ink/40"
                  aria-hidden
                />
                {t("pause")}
              </li>
            )}
          </ul>
        </div>

        <div className="relative" style={{ height: board.height }}>
          <ol className="absolute inset-0">
            {board.blocks.map((b, i) => (
              <li
                key={b.id}
                className="absolute pr-1 py-0.5"
                style={{
                  top: b.top,
                  height: b.height,
                  left: `calc(3.5rem + (100% - 3.5rem) * ${b.lane / b.lanes})`,
                  width: `calc((100% - 3.5rem) / ${b.lanes})`,
                }}
              >
                <span
                  className="absolute -left-14 top-1 w-12 text-right text-sm font-bold tabular-nums"
                  aria-hidden
                >
                  {time.format(b.start)}
                </span>
                <Block
                  block={b}
                  style={styleMap.get(b.poule || otherLabel) ?? "plain"}
                  progress={progressOf(b, now)}
                  tilt={i % 2 === 0 ? "-rotate-[0.4deg]" : "rotate-[0.4deg]"}
                  timeRange={`${time.format(b.start)} → ${time.format(b.end)}`}
                  poule={b.poule || otherLabel}
                  liveLabel={t("live")}
                  finishedLabel={t("finished")}
                  linkTeams={linkTeams}
                />
              </li>
            ))}
          </ol>

          {board.pauses.map((p) => (
            <div
              key={p.start}
              className="absolute left-14 right-1 flex items-center justify-center py-1"
              style={{ top: p.top, height: p.height }}
            >
              <div className="h-full w-full rounded-xl border-2 border-dashed border-derby-ink/25 bg-white/50 flex items-center justify-center gap-2 text-sm font-bold text-derby-ink/70">
                <span aria-hidden>☕</span>
                {t("pause")} · {t("pauseMinutes", { minutes: Math.round((p.end - p.start) / MIN) })}
                <span className="font-normal">
                  ({time.format(p.start)} → {time.format(p.end)})
                </span>
              </div>
            </div>
          ))}

          {showNow && (
            <div
              className="absolute left-0 right-0 z-10 flex items-center pointer-events-none transition-[top] duration-1000 ease-linear"
              style={{ top: yAt(board.axis, now) }}
              aria-hidden
            >
              <span className="bg-derby-accent text-white text-xs font-bold rounded-full px-2 py-0.5 w-12 text-center -translate-y-1/2">
                {t("now")}
              </span>
              <span className="flex-1 h-0.5 bg-derby-accent -translate-y-1/2" />
              <span className="w-2.5 h-2.5 rounded-full bg-derby-accent -translate-y-1/2 animate-ping" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TeamName({
  team,
  link,
  className,
}: {
  team: ScheduleTeam;
  link: boolean;
  className: string;
}) {
  if (!link) return <span className={className}>{team.name}</span>;
  return (
    <Link
      href={`/teams/${team.id}`}
      className={`${className} underline decoration-2 decoration-transparent underline-offset-4 hover:decoration-current`}
    >
      {team.name}
    </Link>
  );
}

function TeamDot({ team }: { team: ScheduleTeam }) {
  if (!team.color) return null;
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white/70 shrink-0"
      style={{ background: team.color }}
      aria-hidden
    />
  );
}

function Block({
  block,
  style,
  progress,
  tilt,
  timeRange,
  poule,
  liveLabel,
  finishedLabel,
  linkTeams,
}: {
  block: BoardBlock;
  style: PouleStyle;
  progress: number;
  tilt: string;
  timeRange: string;
  poule: string;
  liveLabel: string;
  finishedLabel: string;
  linkTeams: boolean;
}) {
  const isLive = block.status === "live";
  const showScore = block.status !== "scheduled" && block.scoreA != null && block.scoreB != null;
  return (
    <div
      className={`relative h-full overflow-hidden rounded-xl shadow px-3 py-1.5 flex flex-col justify-between transition-transform hover:rotate-0 hover:scale-[1.01] ${tilt} ${
        BLOCK_STYLES[style]
      } ${isLive ? "ring-4 ring-derby-ink ring-offset-2 ring-offset-derby-bg rotate-0" : ""}`}
    >
      {isLive && (
        <span
          className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
      )}
      <div className="relative flex items-center justify-between gap-2 text-xs opacity-90">
        <span className="tabular-nums">{timeRange}</span>
        <span className="truncate">
          {isLive ? (
            <span className="font-bold">{liveLabel}</span>
          ) : block.status === "finished" ? (
            `✓ ${finishedLabel}`
          ) : (
            poule
          )}
        </span>
      </div>
      <div className="relative space-y-1">
        <TeamRow team={block.teamA} score={showScore ? block.scoreA : null} other={block.scoreB} link={linkTeams} />
        <TeamRow team={block.teamB} score={showScore ? block.scoreB : null} other={block.scoreA} link={linkTeams} />
      </div>
    </div>
  );
}

function TeamRow({
  team,
  score,
  other,
  link,
}: {
  team: ScheduleTeam;
  score: number | null;
  other: number | null;
  link: boolean;
}) {
  const behind = score != null && other != null && score < other;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 min-w-0">
        <TeamDot team={team} />
        <TeamName team={team} link={link} className="font-display text-xl leading-none truncate" />
      </span>
      {score != null && (
        <span className={`font-display text-2xl leading-none tabular-nums ${behind ? "opacity-60" : ""}`}>
          {score}
        </span>
      )}
    </div>
  );
}

function Spotlight({
  match,
  label,
  live,
  linkTeams,
  children,
}: {
  match: ScheduleMatch;
  label: string;
  live?: boolean;
  linkTeams: boolean;
  children: React.ReactNode;
}) {
  const showScore = live && match.scoreA != null && match.scoreB != null;
  return (
    <section className="bg-derby-ink text-white rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
        {live && (
          <span className="relative flex w-3 h-3" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-derby-accent animate-ping" />
            <span className="relative w-3 h-3 rounded-full bg-derby-accent" />
          </span>
        )}
        {label}
        {match.poule && <span className="font-normal text-white/70 normal-case">· {match.poule}</span>}
      </p>
      <div className="space-y-1 sm:hidden">
        {[
          { team: match.teamA, score: match.scoreA },
          { team: match.teamB, score: match.scoreB },
        ].map(({ team, score }) => (
          <div key={team.id} className="flex items-center justify-between gap-3">
            <TeamName team={team} link={linkTeams} className="font-display text-3xl leading-none min-w-0 truncate" />
            {showScore && (
              <span className="font-display text-4xl leading-none text-derby-accent tabular-nums">{score}</span>
            )}
          </div>
        ))}
      </div>
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamName team={match.teamA} link={linkTeams} className="font-display text-4xl leading-none min-w-0" />
        <span className="font-display text-6xl leading-none text-derby-accent tabular-nums whitespace-nowrap">
          {showScore ? `${match.scoreA} : ${match.scoreB}` : "vs"}
        </span>
        <TeamName
          team={match.teamB}
          link={linkTeams}
          className="font-display text-4xl leading-none text-right min-w-0"
        />
      </div>
      {children}
    </section>
  );
}

function ProgressBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div>
      <div
        className="relative h-4 rounded-full bg-white/15"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuetext={label}
      >
        <div
          className="stripes h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl transition-[left] duration-1000 ease-linear"
          style={{ left: `${progress * 100}%` }}
          aria-hidden
        >
          🛼
        </span>
      </div>
      <p className="mt-2 text-sm text-white/80 tabular-nums">{label}</p>
    </div>
  );
}

function Rosters({ match, heading }: { match: ScheduleMatch; heading: string }) {
  const teams = [match.teamA, match.teamB].filter((team) => team.players && team.players.length > 0);
  if (teams.length === 0) return null;
  return (
    <details className="group border-t border-white/15 pt-3" open>
      <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-white/80 list-none flex items-center gap-2">
        <span className="transition-transform group-open:rotate-90" aria-hidden>
          ▸
        </span>
        {heading}
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id}>
            <p className="font-display text-xl mb-2 flex items-center gap-2">
              <TeamDot team={team} />
              {team.name}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {team.players!.map((p) => (
                <PlayerChip key={p.id} player={p} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

function PlayerChip({ player }: { player: SchedulePlayer }) {
  return (
    <li className="flex items-center gap-1.5 min-w-0 bg-white/10 rounded-full pl-1 pr-3 py-1 text-sm">
      {player.headshotUrl ? (
        <Image
          src={player.headshotUrl}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover shrink-0"
        />
      ) : (
        <span className="w-6 h-6 shrink-0 rounded-full bg-derby-accent flex items-center justify-center text-[10px] font-bold" aria-hidden>
          🛼
        </span>
      )}
      <span className="font-bold tabular-nums">#{player.number}</span>
      <span className="truncate">{player.derbyName}</span>
    </li>
  );
}
