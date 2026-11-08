// One-off production migration: add Match.shirtA/shirtB and fill the agreed shirt colours.
// Idempotent; only fills shirts that are still empty.
// Run with: node --env-file=.env.production.local scripts/migrate-shirts-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });

const columns = (await db.execute(`PRAGMA table_info("Match")`)).rows.map((r) => r.name);
for (const col of ["shirtA", "shirtB"]) {
  if (!columns.includes(col)) {
    await db.execute(`ALTER TABLE "Match" ADD COLUMN "${col}" TEXT`);
    console.log(`Added column Match.${col}`);
  }
}

const SHIRTS = [
  ["Roadkill Rollers Nijmegen", "Black Sheep Honey Rollers", "zwart", "wit"],
  ["Thunder & Lightning", "Rock City Rollers", "paars", "zwart (of groen)"],
  ["Roadkill Rollers Nijmegen", "Thunder & Lightning", "zwart", "paars"],
  ["Black Sheep Honey Rollers", "Rock City Rollers", "zwart", "paars"],
  ["Roadkill Rollers Nijmegen", "Rock City Rollers", "zwart", "paars"],
  ["Black Sheep Honey Rollers", "Thunder & Lightning", "zwart", "paars"],
  ["Arnhem Fallen Angels", "Amsterdam Roller Derby", "zwart", "roze"],
  ["Roller Derby Breda", "Pink Peril", "zwart", "roze"],
  ["Arnhem Fallen Angels", "Roller Derby Breda", "zwart", "paars of wit"],
  ["Amsterdam Roller Derby", "Pink Peril", "wit", "roze"],
  ["Arnhem Fallen Angels", "Pink Peril", "zwart", "roze"],
  ["Amsterdam Roller Derby", "Roller Derby Breda", "roze", "zwart"],
];

for (const [a, b, shirtA, shirtB] of SHIRTS) {
  const res = await db.execute({
    sql: `UPDATE "Match" SET "shirtA" = COALESCE("shirtA", ?), "shirtB" = COALESCE("shirtB", ?)
          WHERE "teamAId" = (SELECT "id" FROM "Team" WHERE "name" = ?)
            AND "teamBId" = (SELECT "id" FROM "Team" WHERE "name" = ?)
            AND "teamALabel" IS NULL AND "teamBLabel" IS NULL`,
    args: [shirtA, shirtB, a, b],
  });
  console.log(`${res.rowsAffected === 1 ? "ok " : "!! "}${a} vs ${b}: ${res.rowsAffected} row(s)`);
}
console.log("Done.");
