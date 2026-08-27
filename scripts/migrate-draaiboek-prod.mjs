// One-off production migration: tables for the draaiboek / volunteer roster
// (/draaiboek/<token>). Idempotent (CREATE TABLE IF NOT EXISTS), no backfill:
// the page seeds its default posts on first load when VolunteerTask is empty.
// Run with: node --env-file=.env.production.local scripts/migrate-draaiboek-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");
const db = createClient({ url, authToken });

const stmts = [
  `CREATE TABLE IF NOT EXISTS "VolunteerTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "area" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "info" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "VolunteerShift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "need" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "VolunteerShift_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "VolunteerTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Volunteer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "VolunteerSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VolunteerSignup_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "VolunteerShift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolunteerSignup_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "Volunteer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VolunteerSignup_shiftId_volunteerId_key" ON "VolunteerSignup"("shiftId", "volunteerId")`,
  `CREATE TABLE IF NOT EXISTS "DraaiboekItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "fase" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "wie" TEXT NOT NULL DEFAULT '',
    "datum" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
  )`,
];
for (const s of stmts) await db.execute(s);
for (const t of ["VolunteerTask", "VolunteerShift", "Volunteer", "VolunteerSignup", "DraaiboekItem"]) {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
  console.log(`${t}: ${r.rows[0].n} rows`);
}
console.log("Done.");
