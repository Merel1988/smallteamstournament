// Officials meeting at 11:00, captains meeting at 11:15; drop the "Bar & keuken" and "Captains meeting" volunteer tasks.
// Usage: node --env-file=.env.production.local scripts/update-meetings-bar-prod.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });
const now = new Date().toISOString();

await db.execute({
  sql: `UPDATE "ProgramItem" SET "start" = ?, "updatedAt" = ? WHERE "titleNl" = ?`,
  args: [660, now, "Officials meeting"],
});
await db.execute({
  sql: `UPDATE "ProgramItem" SET "start" = ?, "updatedAt" = ? WHERE "titleNl" = ?`,
  args: [675, now, "Captains meeting"],
});

for (const name of ["Bar & keuken", "Captains meeting"]) {
  const signups = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM "VolunteerSignup" WHERE "shiftId" IN
            (SELECT s."id" FROM "VolunteerShift" s JOIN "VolunteerTask" t ON t."id" = s."taskId" WHERE t."name" = ?)`,
    args: [name],
  });
  if (Number(signups.rows[0].n) > 0) {
    console.log(`"${name}" has ${signups.rows[0].n} signup(s); not deleted.`);
    continue;
  }
  await db.batch(
    [
      { sql: `DELETE FROM "VolunteerShift" WHERE "taskId" IN (SELECT "id" FROM "VolunteerTask" WHERE "name" = ?)`, args: [name] },
      { sql: `DELETE FROM "VolunteerTask" WHERE "name" = ?`, args: [name] },
    ],
    "write",
  );
}

console.log((await db.execute(`SELECT "start", "titleNl" FROM "ProgramItem" ORDER BY "start"`)).rows);
console.log(
  (
    await db.execute(
      `SELECT t."name", s."start", s."end" FROM "VolunteerTask" t JOIN "VolunteerShift" s ON s."taskId" = t."id"
       WHERE t."name" IN ('Captains meeting', 'Bar & keuken')`,
    )
  ).rows,
);
