// One-off production migration: drop Player.name and Player.position columns.
// Backfills derbyName from name first so no player loses their display name.
// Run with: node --env-file=.env.production.local scripts/migrate-player-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

const before = await db.execute(
  "SELECT count(*) AS total, count(CASE WHEN derbyName IS NULL OR derbyName='' THEN 1 END) AS missing FROM Player",
);
console.log("Before:", before.rows[0]);

await db.execute(
  "UPDATE \"Player\" SET \"derbyName\" = \"name\" WHERE \"derbyName\" IS NULL OR \"derbyName\" = ''",
);
console.log("Backfilled derbyName from name where missing.");

await db.execute('ALTER TABLE "Player" DROP COLUMN "name"');
console.log("Dropped column: name");

await db.execute('ALTER TABLE "Player" DROP COLUMN "position"');
console.log("Dropped column: position");

const after = await db.execute(
  "SELECT count(*) AS total, count(CASE WHEN derbyName IS NULL OR derbyName='' THEN 1 END) AS missing FROM Player",
);
console.log("After:", after.rows[0]);
console.log("Done.");
