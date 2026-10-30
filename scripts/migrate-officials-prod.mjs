// One-off production migration: create Official and fill it with the distinct names
// from the old per-match OfficialAssignment roster when the table is still empty.
// Idempotent and additive only.
// Run with: node --env-file=.env.production.local scripts/migrate-officials-prod.mjs
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "Official" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
console.log("Ensured table: Official");

const count = (await db.execute(`SELECT COUNT(*) AS n FROM "Official"`)).rows[0].n;
if (Number(count) === 0) {
  const rows = (await db.execute(`SELECT "name" FROM "OfficialAssignment"`).catch(() => ({ rows: [] }))).rows;
  const names = new Map();
  for (const r of rows) {
    const name = String(r.name ?? "").trim();
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  const sorted = [...names.values()].sort((a, b) => a.localeCompare(b, "nl"));
  for (const [i, name] of sorted.entries()) {
    await db.execute({
      sql: `INSERT INTO "Official" ("id", "name", "sortOrder") VALUES (?, ?, ?)`,
      args: [randomUUID(), name, i],
    });
  }
  console.log(`Copied ${sorted.length} names from OfficialAssignment`);
} else {
  console.log(`Official already has ${count} rows, not copying`);
}
console.log("Done.");
