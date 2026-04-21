import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const [teams, players, matches, photos, prompts, rules] = await Promise.all([
    prisma.team.count().catch(() => 0),
    prisma.player.count().catch(() => 0),
    prisma.match.count().catch(() => 0),
    prisma.photo.count().catch(() => 0),
    prisma.bingoPrompt.count({ where: { active: true } }).catch(() => 0),
    prisma.houseRule.count().catch(() => 0),
  ]);

  const stats: { label: string; value: number }[] = [
    { label: "Teams", value: teams },
    { label: "Spelers", value: players },
    { label: "Wedstrijden", value: matches },
    { label: "Foto's", value: photos },
    { label: "Bingo prompts", value: prompts },
    { label: "Huisregels", value: rules },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Admin dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow">
            <div className="text-xs uppercase text-derby-ink/60">{s.label}</div>
            <div className="font-display text-4xl mt-1">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
