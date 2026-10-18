// One-off production migration: add consent, moderation and report columns to Photo.
// Idempotent and additive only. Existing photos stay visible and are marked view-only.
// Run with: node --env-file=.env.production.local scripts/migrate-photos-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

const COLUMNS = [
  ["width", "INTEGER"],
  ["height", "INTEGER"],
  ["shareable", "BOOLEAN NOT NULL DEFAULT false"],
  ["status", "TEXT NOT NULL DEFAULT 'approved'"],
  ["moderationNote", "TEXT"],
  ["reportedAt", "DATETIME"],
  ["reportReason", "TEXT"],
];

const existing = new Set(
  (await db.execute(`PRAGMA table_info("Photo")`)).rows.map((r) => r.name),
);
if (existing.size === 0) throw new Error("Photo table not found");

for (const [name, type] of COLUMNS) {
  if (existing.has(name)) {
    console.log(`Column exists: Photo.${name}`);
    continue;
  }
  await db.execute(`ALTER TABLE "Photo" ADD COLUMN "${name}" ${type}`);
  console.log(`Added column: Photo.${name}`);
}

await db.execute(
  `CREATE INDEX IF NOT EXISTS "Photo_status_createdAt_idx" ON "Photo"("status", "createdAt")`,
);
console.log("Ensured index: Photo_status_createdAt_idx");

const count = (await db.execute(`SELECT COUNT(*) AS n FROM "Photo"`)).rows[0].n;
console.log(`Photo rows: ${count}`);
console.log("Done.");
