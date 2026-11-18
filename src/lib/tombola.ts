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

// Admin input, per line: "ticket: prize" (also "=" or "42 prize"), plain numbers
// ("42", "42, 117") or a lone ticket ("Rood 7"). Without a prize, prize is "".
export function parsePrizeLines(input: string): { ticket: string; prize: string }[] {
  return input
    .split("\n")
    .flatMap((line) => {
      const withPrize = line.match(/^\s*([^:=]+?)\s*[:=]\s*(.+?)\s*$/);
      if (withPrize) return [{ ticket: withPrize[1], prize: withPrize[2] }];
      if (/^[\d\s,;]+$/.test(line)) {
        return line.split(/[\s,;]+/).filter(Boolean).map((ticket) => ({ ticket, prize: "" }));
      }
      const numbered = line.match(/^\s*(\d+)\s+(.+?)\s*$/);
      if (numbered) return [{ ticket: numbered[1], prize: numbered[2] }];
      return [{ ticket: line.trim(), prize: "" }];
    })
    .filter((row) => ticketKey(row.ticket).length > 0)
    .map((row) => ({ ticket: row.ticket.slice(0, 40), prize: row.prize.slice(0, 200) }));
}
