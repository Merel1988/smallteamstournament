// One-off production migration for the "Vorige edities" archive. Idempotent:
// adds Photo.highlightYear and hides the archive page until organisers switch it on.
// Run with: node --env-file=.env.production.local scripts/migrate-editions-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL missing");
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const columns = (await db.execute(`PRAGMA table_info("Photo")`)).rows.map((r) => r.name);
if (!columns.includes("highlightYear")) {
  await db.execute(`ALTER TABLE "Photo" ADD COLUMN "highlightYear" INTEGER`);
  console.log("Added Photo.highlightYear");
}
await db.execute(
  `INSERT OR IGNORE INTO "PageVisibility" ("key", "visible", "updatedAt") VALUES ('vorige-edities', false, CURRENT_TIMESTAMP)`,
);
const row = await db.execute(`SELECT visible FROM "PageVisibility" WHERE key = 'vorige-edities'`);
console.log(`vorige-edities visible: ${row.rows[0].visible}`);
console.log("Done.");
