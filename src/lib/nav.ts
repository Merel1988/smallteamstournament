export type NavLink = { href: string; label: string };
export type NavGroupEntry = { label: string; children: NavLink[] };
export type NavEntry = NavLink | NavGroupEntry;

export function isGroup(entry: NavEntry): entry is NavGroupEntry {
  return "children" in entry;
}
