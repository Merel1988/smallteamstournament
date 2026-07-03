// One-off production migration (FB3): create the SentNotification table.
// Idempotent — safe to run more than once (CREATE TABLE IF NOT EXISTS).
// No data backfill needed (history starts empty).
// Run with: node --env-file=.env.production.local scripts/migrate-sentnotification-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "SentNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "removedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
console.log("Ensured table: SentNotification");

// Verify the table is present and readable.
const rows = await db.execute("SELECT COUNT(*) AS n FROM SentNotification");
console.log(`SentNotification rows: ${rows.rows[0].n}`);
console.log("Done.");
