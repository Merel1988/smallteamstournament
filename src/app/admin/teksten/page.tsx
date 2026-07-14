import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  flattenMessages,
  isValidIcu,
  loadBaseMessages,
} from "@/lib/messages";
import { routing } from "@/i18n/routing";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LOCALE_LABELS: Record<string, string> = { nl: "Nederlands", en: "English" };

function pickLocale(raw: string | undefined): string {
  return raw && (routing.locales as readonly string[]).includes(raw)
    ? raw
    : routing.defaultLocale;
}

// Broadly purge every cached public page so a text edit shows up immediately.
function revalidateEverything() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/teksten");
}

async function saveNamespace(locale: string, formData: FormData) {
  "use server";
  await requireAdmin();
  const loc = pickLocale(locale);
  const base = flattenMessages(await loadBaseMessages(loc));

  for (const [name, raw] of formData.entries()) {
    if (!name.startsWith("k:")) continue;
    const key = name.slice(2);
    if (!(key in base)) continue;
    const value = String(raw);

    // Editing a field back to its default removes the override entirely.
    if (value === base[key]) {
      await prisma.messageOverride.deleteMany({ where: { locale: loc, key } });
      continue;
    }
    // Never persist a value that would break ICU formatting on the site.
    if (!isValidIcu(value)) continue;

    await prisma.messageOverride.upsert({
      where: { locale_key: { locale: loc, key } },
      create: { locale: loc, key, value },
      update: { value },
    });
  }

  revalidateEverything();
}

async function resetKey(locale: string, key: string) {
  "use server";
  await requireAdmin();
  await prisma.messageOverride.deleteMany({
    where: { locale: pickLocale(locale), key },
  });
  revalidateEverything();
}

export default async function AdminTekstenPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  await requireAdmin();
  const locale = pickLocale((await searchParams).locale);

  const base = flattenMessages(await loadBaseMessages(locale));
  const overrides = await prisma.messageOverride.findMany({
    where: { locale },
    select: { key: true, value: true },
  });
  const overrideMap = new Map(overrides.map((o) => [o.key, o.value]));

  // Group leaf keys by top-level namespace, preserving JSON order.
  const namespaces = new Map<string, string[]>();
  for (const key of Object.keys(base)) {
    const ns = key.split(".")[0];
    if (!namespaces.has(ns)) namespaces.set(ns, []);
    namespaces.get(ns)!.push(key);
  }

  const overrideCount = overrideMap.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">Teksten</h1>
        <div className="flex gap-1 ml-auto">
          {routing.locales.map((loc) => (
            <Link
              key={loc}
              href={`/admin/teksten?locale=${loc}`}
              className={`px-3 py-1 text-sm rounded-full font-bold transition ${
                loc === locale
                  ? "bg-derby-ink text-white"
                  : "bg-white shadow hover:bg-derby-accent hover:text-white"
              }`}
            >
              {LOCALE_LABELS[loc] ?? loc}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-derby-ink/70">
        Pas alle teksten aan voor <strong>{LOCALE_LABELS[locale] ?? locale}</strong>.
        Leeg laten kan niet — herstel een veld door het exact op de standaardtekst
        te zetten of via <em>Herstel</em>. {overrideCount} veld
        {overrideCount === 1 ? "" : "en"} aangepast.
      </p>

      {[...namespaces.entries()].map(([ns, keys]) => (
        <form
          key={ns}
          action={saveNamespace.bind(null, locale)}
          className="bg-white rounded-2xl p-5 shadow space-y-4"
        >
          <h2 className="font-display text-2xl">{ns}</h2>

          {keys.map((key) => {
            const baseVal = base[key];
            const overridden = overrideMap.has(key);
            const value = overridden ? overrideMap.get(key)! : baseVal;
            const special = /[{<]/.test(baseVal) || /[{<]/.test(value);
            const short = baseVal.length <= 60 && !baseVal.includes("\n");

            return (
              <div key={key} className="space-y-1">
                <label className="flex flex-wrap items-center gap-2 text-xs font-mono text-derby-ink/60">
                  {key}
                  {overridden && (
                    <span className="rounded-full bg-derby-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      aangepast
                    </span>
                  )}
                  {special && (
                    <span className="rounded-full bg-derby-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-derby-accent">
                      ICU / HTML — bewerk met zorg
                    </span>
                  )}
                </label>
                {short ? (
                  <input
                    name={`k:${key}`}
                    defaultValue={value}
                    className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
                  />
                ) : (
                  <textarea
                    name={`k:${key}`}
                    defaultValue={value}
                    rows={Math.min(6, value.split("\n").length + 1)}
                    className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
                  />
                )}
                {overridden && (
                  <div className="flex items-center gap-3 text-xs text-derby-ink/50">
                    <span className="truncate">
                      Standaard: <span className="italic">{baseVal}</span>
                    </span>
                    <button
                      type="submit"
                      formAction={resetKey.bind(null, locale, key)}
                      className="shrink-0 text-derby-accent font-bold hover:underline"
                    >
                      Herstel
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="submit"
            className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold"
          >
            {ns} opslaan
          </button>
        </form>
      ))}
    </div>
  );
}
