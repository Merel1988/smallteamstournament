// One-off production migration (FB18): team portal with per-team password.
// Adds Team.passwordHash/failedLogins/lockedUntil and Player.pronouns, creates BenchStaff.
// Idempotent and additive only; existing data is untouched.
// Run with: node --env-file=.env.production.local scripts/migrate-teamportal-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

async function addColumns(table, columns) {
  const existing = (await db.execute(`PRAGMA table_info("${table}")`)).rows.map((r) => r.name);
  for (const [name, definition] of columns) {
    if (existing.includes(name)) {
      console.log(`Column exists: ${table}.${name}`);
    } else {
      await db.execute(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${definition}`);
      console.log(`Added column: ${table}.${name}`);
    }
  }
}

await addColumns("Team", [
  ["passwordHash", "TEXT"],
  ["failedLogins", "INTEGER NOT NULL DEFAULT 0"],
  ["lockedUntil", "DATETIME"],
]);
await addColumns("Player", [["pronouns", "TEXT"]]);

await db.execute(`CREATE TABLE IF NOT EXISTS "BenchStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "pronouns" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BenchStaff_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
await db.execute(`CREATE INDEX IF NOT EXISTS "BenchStaff_teamId_idx" ON "BenchStaff"("teamId")`);
console.log("Ensured table: BenchStaff");

for (const table of ["Team", "Player", "BenchStaff"]) {
  const rows = await db.execute(`SELECT COUNT(*) AS n FROM "${table}"`);
  console.log(`${table} rows: ${rows.rows[0].n}`);
}
console.log("Done.");
