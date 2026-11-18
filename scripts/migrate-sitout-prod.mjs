// One-off production migration: create MatchSitOut (players sitting out a game).
// Idempotent and additive only.
// Run with: node --env-file=.env.production.local scripts/migrate-sitout-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "MatchSitOut" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "MatchSitOut_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchSitOut_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)`);
await db.execute(
  `CREATE UNIQUE INDEX IF NOT EXISTS "MatchSitOut_matchId_playerId_key" ON "MatchSitOut"("matchId", "playerId")`,
);
console.log("Ensured table: MatchSitOut");
console.log("Done.");
