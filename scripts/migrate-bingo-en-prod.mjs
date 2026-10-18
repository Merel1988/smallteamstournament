// One-off production migration: add the optional BingoPrompt.textEn column.
// Idempotent and additive only; existing data is untouched.
// Run with: node --env-file=.env.production.local scripts/migrate-bingo-en-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

const columns = (await db.execute(`PRAGMA table_info("BingoPrompt")`)).rows.map((r) => r.name);
if (columns.includes("textEn")) {
  console.log("Column exists: BingoPrompt.textEn");
} else {
  await db.execute(`ALTER TABLE "BingoPrompt" ADD COLUMN "textEn" TEXT`);
  console.log("Added column: BingoPrompt.textEn");
}

const rows = await db.execute(`SELECT COUNT(*) AS n FROM "BingoPrompt"`);
console.log(`BingoPrompt rows: ${rows.rows[0].n}`);
console.log("Done.");
