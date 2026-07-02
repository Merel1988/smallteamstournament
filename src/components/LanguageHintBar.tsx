"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const STORAGE_KEY = "derby-lang-hint-v1";

export default function LanguageHintBar() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LanguageHint");
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(true);

  // Read dismiss state after mount so SSR and first client render match.
  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const other = (routing.locales.find((l) => l !== locale) ??
    locale) as (typeof routing.locales)[number];

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function switchLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: other });
    });
  }

  return (
    <div className="bg-derby-yellow text-derby-ink text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-3 flex-wrap text-center">
        <span>{t("message")}</span>
        <button
          type="button"
          onClick={switchLocale}
          disabled={pending}
          className="font-bold underline underline-offset-2 disabled:opacity-60"
        >
          {t("action")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="ml-auto shrink-0 rounded-full px-2 leading-none text-derby-ink/60 hover:text-derby-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
