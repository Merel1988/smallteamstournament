// Freezes teams, rosters and results of the current tournament into
// src/data/editions/<year>/snapshot.json, so the archive survives next year's reset.
// Run with: node --env-file=.env.production.local scripts/snapshot-edition.mjs 2026
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const year = Number(process.argv[2]);
if (!year) throw new Error("Usage: snapshot-edition.mjs <year>");
const url = process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const rows = async (sql) => (await db.execute(sql)).rows;

const slug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const teams = await rows(`SELECT * FROM "Team" ORDER BY name`);
const players = await rows(`SELECT * FROM "Player" ORDER BY derbyName`);
const staff = await rows(`SELECT * FROM "BenchStaff" ORDER BY sortOrder, name`);
const matches = await rows(
  `SELECT * FROM "Match" WHERE status = 'finished' AND scoreA IS NOT NULL ORDER BY startsAt`,
);

const keyById = new Map(teams.map((t) => [t.id, slug(t.name)]));

const snapshot = {
  year,
  takenAt: new Date().toISOString(),
  teams: teams.map((t) => ({
    key: keyById.get(t.id),
    name: t.name,
    color: t.color,
    logoUrl: t.logoUrl,
    descriptionNl: t.descriptionNl,
    descriptionEn: t.descriptionEn,
    players: players
      .filter((p) => p.teamId === t.id)
      .map((p) => ({
        number: p.number,
        derbyName: p.derbyName,
        pronouns: p.pronouns,
        headshotUrl: p.headshotUrl,
      })),
    benchStaff: staff
      .filter((s) => s.teamId === t.id)
      .map((s) => ({ name: s.name, role: s.role, pronouns: s.pronouns })),
  })),
  matches: matches.map((m) => ({
    startsAt: new Date(m.startsAt).toISOString(),
    poule: m.poule,
    teamA: keyById.get(m.teamAId),
    teamB: keyById.get(m.teamBId),
    scoreA: Number(m.scoreA),
    scoreB: Number(m.scoreB),
  })),
};

const dir = `src/data/editions/${year}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/snapshot.json`, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`${dir}/snapshot.json: ${snapshot.teams.length} teams, ${players.length} players, ${snapshot.matches.length} matches`);
