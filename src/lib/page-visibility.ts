import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Returns the set of page keys that are currently hidden. A page is hidden only
// when it has a PageVisibility row with visible=false; absent rows are visible.
// On DB error we fall back to "nothing hidden" so a glitch never blanks the site.
export async function getHiddenPageKeys(): Promise<Set<string>> {
  const rows = await prisma.pageVisibility
    .findMany({ where: { visible: false }, select: { key: true } })
    .catch(() => [] as { key: string }[]);
  return new Set(rows.map((r) => r.key));
}

// Guard for a public route: call at the top of the page component. If the page
// is toggled off, the route 404s instead of rendering. Requires the route to be
// dynamically rendered (all guarded routes set `dynamic = "force-dynamic"`).
export async function assertPageVisible(key: string): Promise<void> {
  const hidden = await getHiddenPageKeys();
  if (hidden.has(key)) notFound();
}
