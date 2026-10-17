// One-off production migration: create LockerRoom and fill it with the initial
// division when the table is still empty. Idempotent and additive only.
// Run with: node --env-file=.env.production.local scripts/migrate-lockerroom-prod.mjs
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

await db.execute(`CREATE TABLE IF NOT EXISTS "LockerRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room" TEXT NOT NULL,
    "labelNl" TEXT NOT NULL,
    "labelEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)`);
console.log("Ensured table: LockerRoom");

const ROOMS = [
  ["1", "Eten + chillen voor officials en vrijwilligers", "Food + chill for officials and volunteers"],
  ["2", "Roadkill Rollers Nijmegen\nArnhem Fallen Angels", null],
  ["3", "Black Sheep Honey Rollers\nMine Monsters Oberhausen", null],
  ["4", "Thunder & Lightning\nRoller Derby Breda", null],
  ["5", "Rock City Rollers\nPink Peril", null],
  ["6", "Officials", null],
];

const count = (await db.execute(`SELECT COUNT(*) AS n FROM "LockerRoom"`)).rows[0].n;
if (Number(count) === 0) {
  const now = new Date().toISOString();
  for (const [i, [room, labelNl, labelEn]] of ROOMS.entries()) {
    await db.execute({
      sql: `INSERT INTO "LockerRoom" ("id", "room", "labelNl", "labelEn", "sortOrder", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), room, labelNl, labelEn, i, now],
    });
  }
  console.log(`Seeded ${ROOMS.length} locker rooms`);
} else {
  console.log(`LockerRoom already has ${count} rows, not seeding`);
}
console.log("Done.");
