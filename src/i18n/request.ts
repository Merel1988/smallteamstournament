import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { applyOverrides, loadBaseMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = await loadBaseMessages(locale);

  // Layer editable DB overrides on top of the JSON base. Any failure here
  // (DB down, bad data) must never break the site — fall back to base.
  let messages = base;
  try {
    const overrides = await prisma.messageOverride.findMany({
      where: { locale },
      select: { key: true, value: true },
    });
    if (overrides.length) messages = applyOverrides(base, overrides);
  } catch {
    messages = base;
  }

  return {
    locale,
    messages,
    // A malformed message must render a fallback, never crash the page.
    onError() {},
    getMessageFallback({ key }) {
      return key;
    },
  };
});
