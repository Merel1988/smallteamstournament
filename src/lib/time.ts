export const EVENT_TIME_ZONE = "Europe/Amsterdam";

function zoneParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function zoneOffsetMs(d: Date): number {
  const p = zoneParts(d);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

// Parses a `datetime-local` value as wall-clock time in the event time zone,
// independent of the server's own time zone (UTC on Vercel).
export function parseEventLocal(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return new Date(NaN);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const first = guess - zoneOffsetMs(new Date(guess));
  return new Date(guess - zoneOffsetMs(new Date(first)));
}

export function toEventLocalInput(d: Date): string {
  const p = zoneParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function eventTimeFormatter(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}
