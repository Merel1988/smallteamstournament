// One-off production migration (FB16): create ProgramItem and OfficialAssignment,
// and add the optional Match.teamALabel / Match.teamBLabel placeholder columns.
// Idempotent and additive only (CREATE ... IF NOT EXISTS); existing data is untouched.
// Run with: node --env-file=.env.production.local scripts/migrate-infopack-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "ProgramItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" INTEGER NOT NULL,
    "end" INTEGER,
    "titleNl" TEXT NOT NULL,
    "titleEn" TEXT,
    "noteNl" TEXT,
    "noteEn" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`);
console.log("Ensured table: ProgramItem");

await db.execute(`CREATE TABLE IF NOT EXISTS "OfficialAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pronouns" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OfficialAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
await db.execute(
  `CREATE INDEX IF NOT EXISTS "OfficialAssignment_matchId_idx" ON "OfficialAssignment"("matchId")`,
);
console.log("Ensured table: OfficialAssignment");

const matchColumns = (await db.execute(`PRAGMA table_info("Match")`)).rows.map((r) => r.name);
for (const column of ["teamALabel", "teamBLabel"]) {
  if (matchColumns.includes(column)) {
    console.log(`Column exists: Match.${column}`);
  } else {
    await db.execute(`ALTER TABLE "Match" ADD COLUMN "${column}" TEXT`);
    console.log(`Added column: Match.${column}`);
  }
}

for (const table of ["ProgramItem", "OfficialAssignment", "Match"]) {
  const rows = await db.execute(`SELECT COUNT(*) AS n FROM "${table}"`);
  console.log(`${table} rows: ${rows.rows[0].n}`);
}
console.log("Done.");
