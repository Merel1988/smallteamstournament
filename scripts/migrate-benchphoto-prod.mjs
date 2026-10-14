// One-off production migration: add the optional BenchStaff.headshotUrl column.
// Idempotent and additive only; existing data is untouched.
// Run with: node --env-file=.env.production.local scripts/migrate-benchphoto-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

const columns = (await db.execute(`PRAGMA table_info("BenchStaff")`)).rows.map((r) => r.name);
if (columns.includes("headshotUrl")) {
  console.log("Column exists: BenchStaff.headshotUrl");
} else {
  await db.execute(`ALTER TABLE "BenchStaff" ADD COLUMN "headshotUrl" TEXT`);
  console.log("Added column: BenchStaff.headshotUrl");
}

const rows = await db.execute(`SELECT COUNT(*) AS n FROM "BenchStaff"`);
console.log(`BenchStaff rows: ${rows.rows[0].n}`);
console.log("Done.");
