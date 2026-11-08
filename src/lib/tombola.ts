export const MAX_TICKETS_PER_CHECK = 20;

export function ticketKey(ticket: string): string {
  return ticket
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(^|[^0-9])0+(?=\d)/g, "$1");
}

// Splits on commas, semicolons and new lines; a part made of plain numbers only
// ("12 34") is split on spaces too, while "rood 12" stays one ticket.
export function parseTickets(input: string): string[] {
  const parts = input
    .split(/[,;\n]+/)
    .flatMap((part) => {
      const words = part.trim().split(/\s+/).filter(Boolean);
      return words.every((w) => /^\d+$/.test(w)) ? words : [words.join(" ")];
    })
    .filter((t) => ticketKey(t).length > 0);
  const seen = new Set<string>();
  return parts.filter((t) => !seen.has(ticketKey(t)) && seen.add(ticketKey(t))).slice(0, MAX_TICKETS_PER_CHECK);
}

// Admin bulk input: one "ticket: prize" per line (also "=" or just "42 prize").
export function parsePrizeLines(input: string): { ticket: string; prize: string }[] {
  return input
    .split("\n")
    .map((line) => line.match(/^\s*([^:=]+?)\s*[:=]\s*(.+?)\s*$/) ?? line.match(/^\s*(\d+)\s+(.+?)\s*$/))
    .filter((m): m is RegExpMatchArray => m !== null && ticketKey(m[1]).length > 0)
    .map((m) => ({ ticket: m[1].slice(0, 40), prize: m[2].slice(0, 200) }));
}
