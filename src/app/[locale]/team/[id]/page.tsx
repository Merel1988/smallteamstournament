import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { LOCK_MINUTES, canEditTeam } from "@/lib/team-auth";
import {
  BenchForm,
  BenchRoleOptions,
  PlayerForm,
} from "@/components/team-portal/RosterForms";
import {
  deleteBench,
  deletePlayer,
  loginTeam,
  logoutTeam,
  saveBench,
  savePlayer,
} from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TeamPortal" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function TeamPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("TeamPortal");

  const team = await prisma.team.findUnique({
    where: { id },
    select: { id: true, name: true, password: true },
  });
  if (!team) notFound();

  if (!(await canEditTeam(team.id))) {
    if (!team.password) {
      return (
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow space-y-2">
          <h1 className="font-display text-3xl">{team.name}</h1>
          <p className="text-derby-ink/70">{t("closed")}</p>
        </div>
      );
    }
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <form
          action={loginTeam}
          className="bg-white rounded-2xl p-6 shadow max-w-sm w-full space-y-4"
        >
          <h1 className="font-display text-3xl">
            {t("loginHeading", { team: team.name })}
          </h1>
          <p className="text-sm text-derby-ink/70">{t("loginIntro")}</p>
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="block text-sm mb-1">{t("password")}</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
            />
          </label>
          {error === "wrong" && (
            <p role="alert" className="text-sm text-derby-accent">
              {t("errorWrong")}
            </p>
          )}
          {error === "locked" && (
            <p role="alert" className="text-sm text-derby-accent">
              {t("errorLocked", { minutes: LOCK_MINUTES })}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-derby-ink text-white rounded-full py-2 font-bold"
          >
            {t("login")}
          </button>
        </form>
      </div>
    );
  }

  const [players, bench] = await Promise.all([
    prisma.player.findMany({ where: { teamId: id }, orderBy: { number: "asc" } }),
    prisma.benchStaff.findMany({
      where: { teamId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="space-y-2">
        <h1 className="font-display text-4xl">{team.name}</h1>
        <p className="text-derby-ink/70">{t("intro")}</p>
        <form
          action={logoutTeam.bind(null, team.id, locale)}
          className="flex flex-wrap items-center gap-3 text-sm text-derby-ink/60"
        >
          <span>{t("loggedInAs", { team: team.name })}</span>
          <button type="submit" className="underline underline-offset-2">
            {t("logout")}
          </button>
        </form>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-3xl">
          {t("skatersHeading")} ({players.length})
        </h2>
        {players.length === 0 && (
          <p className="text-derby-ink/60">{t("skatersEmpty")}</p>
        )}
        {players.map((p) => (
          <PlayerForm
            key={p.id}
            teamId={team.id}
            player={p}
            save={savePlayer.bind(null, team.id, p.id)}
            remove={deletePlayer.bind(null, team.id, p.id)}
          />
        ))}
        <h3 className="font-display text-2xl pt-2">{t("addSkater")}</h3>
        <PlayerForm teamId={team.id} save={savePlayer.bind(null, team.id, null)} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl">{t("benchHeading")}</h2>
        <BenchRoleOptions />
        {bench.length === 0 && (
          <p className="text-derby-ink/60">{t("benchEmpty")}</p>
        )}
        {bench.map((b) => (
          <BenchForm
            key={b.id}
            member={b}
            save={saveBench.bind(null, team.id, b.id)}
            remove={deleteBench.bind(null, team.id, b.id)}
          />
        ))}
        <h3 className="font-display text-2xl pt-2">{t("addBench")}</h3>
        <BenchForm save={saveBench.bind(null, team.id, null)} />
      </section>
    </div>
  );
}
