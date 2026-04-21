"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1 text-xs text-derby-yellow">
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as (typeof routing.locales)[number];
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
        className="bg-transparent text-derby-yellow border border-derby-yellow/40 rounded px-1 py-0.5"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="text-derby-ink">
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
