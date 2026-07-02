// One-off production migration (FB1): create the PageVisibility table.
// Idempotent — safe to run more than once (CREATE TABLE IF NOT EXISTS).
// A missing row means "visible", so no data backfill is needed.
// Run with: node --env-file=.env.production.local scripts/migrate-pagevisibility-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "PageVisibility" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
)`);
console.log('Ensured table: PageVisibility');

// Verify the table is present and readable.
const rows = await db.execute("SELECT key, visible FROM PageVisibility");
console.log(`PageVisibility rows: ${rows.rows.length}`);
console.log("Done.");
