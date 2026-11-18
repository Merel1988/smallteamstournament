import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { when } from "@/components/draaiboek/util";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

type Person = { name: string; official: boolean; teams: Set<string>; shifts: { start: number; label: string }[] };

export default async function AdminPrintListPage() {
  await requireAdmin();
  const [officials, volunteers, teams] = await Promise.all([
    prisma.official.findMany({ select: { name: true } }).catch(() => []),
    prisma.volunteer
      .findMany({ include: { signups: { include: { shift: { include: { task: true } } } } } })
      .catch(() => []),
    prisma.team.findMany({ select: { id: true, name: true } }).catch(() => []),
  ]);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  const people = new Map<string, Person>();
  const person = (name: string) => {
    const key = name.trim().toLowerCase().replace(/[’']/g, "'");
    let p = people.get(key);
    if (!p) {
      p = { name: name.trim(), official: false, teams: new Set(), shifts: [] };
      people.set(key, p);
    }
    return p;
  };
  for (const o of officials) person(o.name).official = true;
  for (const v of volunteers) {
    const p = person(v.name);
    if (v.teamId && teamName.has(v.teamId)) p.teams.add(teamName.get(v.teamId)!);
    for (const s of v.signups) {
      p.shifts.push({ start: s.shift.start, label: `${s.shift.task.name} (${when(s.shift)})` });
    }
  }
  const rows = [...people.values()]
    .filter((p) => p.name)
    .sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));

  return (
    <div className="space-y-4 print:text-black">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-derby-ink/70 max-w-xl">
          Alle officials (uit de infopack) en vrijwilligers (uit het draaiboek) op naam. Print hem uit voor de entree
          en de bar.
        </p>
        <PrintButton />
      </div>

      <h1 className="font-display text-4xl print:text-2xl">Officials en vrijwilligers ({rows.length})</h1>

      <table className="w-full bg-white rounded-2xl shadow text-sm print:shadow-none print:rounded-none">
        <thead>
          <tr className="text-left border-b-2 border-derby-ink/30">
            <th className="px-3 py-2 w-8" aria-label="Afvinken" />
            <th className="px-3 py-2">Naam</th>
            <th className="px-3 py-2">Rol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const roles = [
              ...(p.official ? ["Official"] : []),
              ...[...p.teams].map((t) => `Skater ${t}`),
              ...p.shifts.sort((a, b) => a.start - b.start).map((s) => s.label),
            ];
            return (
              <tr key={p.name} className="border-b border-derby-ink/10 break-inside-avoid">
                <td className="px-3 py-1.5">
                  <span className="inline-block size-4 border-2 border-derby-ink/60 rounded-sm" aria-hidden />
                </td>
                <td className="px-3 py-1.5 font-bold whitespace-nowrap">{p.name}</td>
                <td className="px-3 py-1.5">{roles.join(", ") || "Vrijwilliger"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
