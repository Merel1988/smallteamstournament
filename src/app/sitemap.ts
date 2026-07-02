import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL, localizedPath, languageAlternates } from "@/lib/seo";
import { getHiddenPageKeys } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

// Public, indexable routes (locale-agnostic paths). `notificaties` is a utility
// page (noindex) and admin lives outside [locale] — both are excluded.
const STATIC_PATHS = [
  "",
  "aanmelden",
  "teams",
  "schema",
  "bingo",
  "fotos",
  "mvp",
  "nickname",
  "regels",
  "venue",
];

function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap[number] {
  return {
    url: SITE_URL + localizedPath("nl", path),
    lastModified,
    alternates: { languages: languageAlternates(path) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A togglable page's key equals its path segment, so a hidden page is simply
  // dropped from the sitemap (home has path "" and is never togglable).
  const hidden = await getHiddenPageKeys();
  const staticEntries = STATIC_PATHS.filter((p) => !hidden.has(p)).map((p) =>
    entry(p),
  );

  const teamEntries = hidden.has("teams")
    ? []
    : (
        await prisma.team
          .findMany({ select: { id: true, updatedAt: true } })
          .catch(() => [])
      ).map((t) => entry(`teams/${t.id}`, t.updatedAt));

  return [...staticEntries, ...teamEntries];
}
