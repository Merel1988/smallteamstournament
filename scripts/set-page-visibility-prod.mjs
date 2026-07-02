// Set a page's visibility in production (PageVisibility table, FB1).
// Usage: node --env-file=.env.production.local scripts/set-page-visibility-prod.mjs <key> <on|off>
// Example: ... set-page-visibility-prod.mjs teams off
import { createClient } from "@libsql/client";

const [key, state] = process.argv.slice(2);
if (!key || !["on", "off"].includes(state)) {
  throw new Error('Usage: set-page-visibility-prod.mjs <key> <on|off>');
}
const visible = state === "on" ? 1 : 0;

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });
const now = new Date().toISOString();

await db.execute({
  sql: `INSERT INTO "PageVisibility" ("key","visible","updatedAt") VALUES (?,?,?)
        ON CONFLICT("key") DO UPDATE SET "visible"=excluded."visible", "updatedAt"=excluded."updatedAt"`,
  args: [key, visible, now],
});

const rows = await db.execute("SELECT key, visible FROM PageVisibility ORDER BY key");
console.log(`Set "${key}" -> ${state} (visible=${visible}).`);
console.log("Current PageVisibility rows:", rows.rows);
