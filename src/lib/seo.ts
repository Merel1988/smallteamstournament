import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Canonical production host (apex redirects to www).
export const SITE_URL = "https://www.smallteamstournament.nl";
export const SITE_NAME = "Small Teams Tournament";

/**
 * Build a locale-prefixed absolute path for a locale-agnostic route.
 * `path` is without leading slash, e.g. "" (home), "teams", "teams/abc".
 * Matches next-intl `localePrefix: "as-needed"` — the default locale (nl) has
 * no prefix, other locales are prefixed (`/en/...`).
 */
export function localizedPath(locale: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  const base = locale === routing.defaultLocale ? "" : `/${locale}`;
  if (!clean) return base || "/";
  return `${base}/${clean}`;
}

/** hreflang alternates (+ x-default) for a locale-agnostic route. */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = SITE_URL + localizedPath(l, path);
  languages["x-default"] = SITE_URL + localizedPath(routing.defaultLocale, path);
  return languages;
}

const OG_LOCALE: Record<string, string> = { nl: "nl_NL", en: "en_US" };

/**
 * Metadata for a static public page. `page` is the key under the `PageMeta`
 * namespace (title/description) and `path` its locale-agnostic route.
 * Home passes `absoluteTitle` so the site title isn't run through the layout's
 * `%s · Small Teams Tournament` template.
 */
export async function pageMetadata({
  locale,
  page,
  path,
  absoluteTitle = false,
}: {
  locale: string;
  page: string;
  path: string;
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "PageMeta" });
  const title = t(`${page}.title`);
  const description = t(`${page}.description`);
  const canonical = SITE_URL + localizedPath(locale, path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical, languages: languageAlternates(path) },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? "nl_NL",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
