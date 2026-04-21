import { getTranslations, setRequestLocale } from "next-intl/server";
import NotificationsToggle from "@/components/NotificationsToggle";

export default async function NotificatiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Notifications");

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const richTags = {
    strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <header>
        <h1 className="font-display text-5xl">{t("title")}</h1>
        <p className="text-derby-ink/70 mt-1">{t("subtitle")}</p>
      </header>

      {vapidKey ? (
        <NotificationsToggle vapidKey={vapidKey} />
      ) : (
        <p className="text-derby-ink/60">{t("notConfigured")}</p>
      )}

      <section className="bg-white rounded-2xl p-5 shadow text-sm text-derby-ink/80 space-y-2">
        <p>{t.rich("tip", richTags)}</p>
      </section>
    </div>
  );
}
