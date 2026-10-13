// One-off production fix: match start times entered before the Europe/Amsterdam
// parsing fix were stored as if the typed time was UTC (Vercel runs in UTC),
// so they show one hour late (two in summer time). This moves them back to the intended wall-clock time.
//
// Only rows last updated before --before (the deploy time of the fix) are touched;
// rows saved after the deploy are already correct. A marker row in ScriptRun
// prevents running the fix twice.
//
// Dry run (default):  node --env-file=.env.production.local scripts/fix-match-timezone-prod.mjs --before=2026-10-13T18:00:00Z
// Apply:              node --env-file=.env.production.local scripts/fix-match-timezone-prod.mjs --before=2026-10-13T18:00:00Z --apply
import { createClient } from "@libsql/client";

const NAME = "fix-match-timezone";
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const apply = args.apply === true;
const before = new Date(String(args.before));
if (Number.isNaN(before.getTime())) throw new Error("Pass --before=<ISO deploy time>");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");
const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "ScriptRun" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "ranAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const done = await db.execute({ sql: `SELECT ranAt FROM ScriptRun WHERE name = ?`, args: [NAME] });
if (done.rows.length > 0) {
  console.log(`Already applied at ${done.rows[0].ranAt}; nothing to do.`);
  process.exit(0);
}

const toPrisma = (d) => d.toISOString().replace("Z", "+00:00");

function offsetMs(d) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(d)
      .map((x) => [x.type, Number(x.value)]),
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - d.getTime();
}

// Reinterprets a UTC clock reading as Europe/Amsterdam wall-clock time.
function asAmsterdam(utcReading) {
  const t = utcReading.getTime();
  const first = t - offsetMs(new Date(t));
  return new Date(t - offsetMs(new Date(first)));
}

const amsterdam = new Intl.DateTimeFormat("nl-NL", {
  timeZone: "Europe/Amsterdam",
  dateStyle: "short",
  timeStyle: "short",
});

const { rows } = await db.execute(`SELECT id, startsAt, updatedAt, poule FROM Match ORDER BY startsAt`);
const updates = [];
for (const r of rows) {
  const updated = new Date(r.updatedAt);
  if (updated >= before) {
    console.log(`skip  ${r.id} (${r.poule ?? "-"}) updated after cutoff`);
    continue;
  }
  const start = new Date(r.startsAt);
  // The stored UTC clock reading is what the organiser typed.
  const typed = start.toISOString().slice(11, 16);
  const fixed = asAmsterdam(start);
  console.log(`fix   ${r.id} (${r.poule ?? "-"}) typed ${typed}: now shows ${amsterdam.format(start)}, becomes ${amsterdam.format(fixed)}`);
  updates.push({ sql: `UPDATE Match SET startsAt = ? WHERE id = ?`, args: [toPrisma(fixed), r.id] });
}

if (!apply) {
  console.log(`\nDry run: ${updates.length} of ${rows.length} matches would change. Add --apply to write.`);
  process.exit(0);
}

await db.batch([...updates, { sql: `INSERT INTO ScriptRun (name) VALUES (?)`, args: [NAME] }], "write");
console.log(`\nUpdated ${updates.length} of ${rows.length} matches.`);
