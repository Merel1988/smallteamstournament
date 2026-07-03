import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import RollerSkateLogo from "@/components/RollerSkateLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LanguageHintBar from "@/components/LanguageHintBar";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { getHiddenPageKeys } from "@/lib/page-visibility";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: `%s · ${SITE_NAME}`,
    },
    description: t("description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Derby STT",
    },
    openGraph: {
      siteName: SITE_NAME,
      locale: locale === "nl" ? "nl_NL" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const tFooter = await getTranslations({ locale, namespace: "Footer" });
  const tA11y = await getTranslations({ locale, namespace: "A11y" });

  // The language hint deliberately speaks the *other* language: on the Dutch
  // page it invites English speakers to switch (in English), and vice versa.
  const otherLocale = routing.locales.find((l) => l !== locale) ?? locale;
  const tHint = await getTranslations({
    locale: otherLocale,
    namespace: "LanguageHint",
  });

  const hidden = await getHiddenPageKeys();
  const navItems = [
    { key: "home", href: "/", label: tNav("home") },
    { key: "aanmelden", href: "/aanmelden", label: tNav("aanmelden") },
    { key: "toernooi", href: "/toernooi", label: tNav("toernooi") },
    { key: "teams", href: "/teams", label: tNav("teams") },
    { key: "schema", href: "/schema", label: tNav("schema") },
    { key: "bingo", href: "/bingo", label: tNav("bingo") },
    { key: "fotos", href: "/fotos", label: tNav("photos") },
    { key: "mvp", href: "/mvp", label: tNav("mvp") },
    { key: "regels", href: "/regels", label: tNav("rules") },
    { key: "venue", href: "/venue", label: tNav("venue") },
    { key: "nickname", href: "/nickname", label: tNav("nickname") },
  ].filter((item) => !hidden.has(item.key));

  return (
    <NextIntlClientProvider>
      <a href="#main-content" className="skip-link">
        {tA11y("skipToContent")}
      </a>
      <header className="bg-derby-ink text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <RollerSkateLogo className="h-10 w-auto" />
            <span className="font-display text-2xl text-derby-yellow leading-none">
              Small Teams Tournament
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/notificaties"
              className="text-xs text-derby-yellow underline underline-offset-2"
            >
              {tNav("notifications")}
            </Link>
          </div>
        </div>
        <nav
          aria-label={tA11y("navLabel")}
          className="max-w-6xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1 text-sm hover:bg-derby-accent hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <LanguageHintBar
        targetLocale={otherLocale}
        message={tHint("message")}
        action={tHint("action")}
        dismiss={tHint("dismiss")}
      />

      <main
        id="main-content"
        aria-label={tA11y("mainLabel")}
        className="flex-1 max-w-6xl mx-auto w-full px-4 py-6"
      >
        {children}
      </main>

      <footer className="bg-derby-ink text-white/70 text-xs py-4 text-center">
        <p>{tFooter("line")}</p>
        <a
          href="/admin/login"
          className="text-white/40 hover:text-white/70 underline"
        >
          {tFooter("admin")}
        </a>
      </footer>
    </NextIntlClientProvider>
  );
}
