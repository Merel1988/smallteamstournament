import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import RollerSkateLogo from "@/components/RollerSkateLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Derby STT",
    },
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

  const navItems = [
    { href: "/", label: tNav("home") },
    { href: "/teams", label: tNav("teams") },
    { href: "/schema", label: tNav("schema") },
    { href: "/bingo", label: tNav("bingo") },
    { href: "/fotos", label: tNav("photos") },
    { href: "/mvp", label: tNav("mvp") },
    { href: "/regels", label: tNav("rules") },
    { href: "/venue", label: tNav("venue") },
    { href: "/nickname", label: tNav("nickname") },
  ] as const;

  return (
    <NextIntlClientProvider>
      <header className="bg-derby-ink text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <RollerSkateLogo className="w-12 h-9" />
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
        <nav className="max-w-6xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
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
