import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { daysToEvent, loadState, roleForToken } from "@/lib/draaiboek";
import Draaiboek from "@/components/draaiboek/Draaiboek";

export const dynamic = "force-dynamic";

// Unlisted page: reachable only via the secret token in the URL. Not linked
// anywhere on the public site, blocked in robots.txt and marked noindex.
export const metadata: Metadata = {
  title: "Draaiboek · Small Teams Tournament",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function DraaiboekPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const role = roleForToken(token);
  if (!role) notFound();
  const state = await loadState();
  const days = daysToEvent();
  return <Draaiboek token={token} role={role} initial={state} days={days} />;
}
