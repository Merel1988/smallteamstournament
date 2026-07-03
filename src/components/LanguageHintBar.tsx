"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const STORAGE_KEY = "derby-lang-hint-v1";

type Props = {
  /** Locale to switch to; also the language the strings below are written in. */
  targetLocale: (typeof routing.locales)[number];
  message: string;
  action: string;
  dismiss: string;
};

export default function LanguageHintBar({
  targetLocale,
  message,
  action,
  dismiss: dismissLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(true);

  // Read dismiss state after mount so SSR and first client render match.
  // If still showing, auto-dismiss after 10s (persisted, so it stays gone
  // instead of re-appearing on every navigation).
  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "1";
    setDismissed(isDismissed);
    if (isDismissed) return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setDismissed(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function switchLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: targetLocale });
    });
  }

  return (
    <div className="bg-derby-yellow text-derby-ink text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-3 flex-wrap text-center">
        <span>{message}</span>
        <button
          type="button"
          onClick={switchLocale}
          disabled={pending}
          className="font-bold underline underline-offset-2 disabled:opacity-60"
        >
          {action}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={dismissLabel}
          className="ml-auto shrink-0 rounded-full px-2 leading-none text-derby-ink/60 hover:text-derby-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
