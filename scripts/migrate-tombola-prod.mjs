// One-off production migration: create TombolaPrize and hide the tombola page until the draw.
// Idempotent and additive only.
// Run with: node --env-file=.env.production.local scripts/migrate-tombola-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "TombolaPrize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket" TEXT NOT NULL,
    "ticketKey" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "TombolaPrize_ticketKey_key" ON "TombolaPrize"("ticketKey")`);
console.log("Ensured table: TombolaPrize");

await db.execute(
  `INSERT OR IGNORE INTO "PageVisibility" ("key", "visible", "updatedAt") VALUES ('tombola', false, CURRENT_TIMESTAMP)`,
);
console.log("Tombola page hidden unless it was already toggled");
console.log("Done.");
