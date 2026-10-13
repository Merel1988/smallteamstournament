// The placeholder label (e.g. "Winnaar poule A") wins while the real team is unknown.
export function sideName(team: { name: string }, label: string | null | undefined): string {
  return label?.trim() || team.name;
}
