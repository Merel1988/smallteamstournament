import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { DEFAULT_BINGO_PROMPTS } from "../src/lib/bingo-seed";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding bingo prompts…");
  for (const prompt of DEFAULT_BINGO_PROMPTS) {
    const existing = await prisma.bingoPrompt.findFirst({
      where: { text: prompt.text },
    });
    if (!existing) {
      await prisma.bingoPrompt.create({ data: prompt });
    }
  }

  const ruleCount = await prisma.houseRule.count();
  if (ruleCount === 0) {
    console.log("Seeding huisregels…");
    const rules = [
      {
        order: 1,
        title: "Respect",
        body: "Behandel skaters, officials, vrijwilligers en publiek met respect.",
      },
      {
        order: 2,
        title: "Geen eten/drinken in de speelhal",
        body: "Alleen water in een afsluitbare fles. Andere consumpties: bij de kantine.",
      },
      {
        order: 3,
        title: "Bags out of the way",
        body: "Tassen horen in de kleedkamer, niet in de wisselzone.",
      },
      {
        order: 4,
        title: "Foto's maken mag",
        body: "Flitslicht uit, privacy respecteren. Deel je leukste foto via /fotos.",
      },
      {
        order: 5,
        title: "EHBO bij de ingang",
        body: "Zie je iets? Meld het bij de organisatietafel.",
      },
    ];
    for (const r of rules) {
      await prisma.houseRule.create({ data: r });
    }
  }

  const teamCount = await prisma.team.count();
  if (teamCount === 0 && process.env.SEED_DEMO === "1") {
    console.log("Seeding demo teams + spelers + wedstrijd…");
    const teamA = await prisma.team.create({
      data: {
        name: "Roadkill Rollers",
        shortName: "RKR",
        color: "#ff3e6c",
        description: "Thuisteam — Nijmegen",
      },
    });
    const teamB = await prisma.team.create({
      data: {
        name: "Demo Derby Dolls",
        shortName: "DDD",
        color: "#6d28d9",
      },
    });
    await prisma.player.createMany({
      data: [
        { teamId: teamA.id, name: "Demo Skater 1", number: "42", position: "Jammer" },
        { teamId: teamA.id, name: "Demo Skater 2", number: "7", position: "Blocker" },
        { teamId: teamB.id, name: "Demo Skater 3", number: "99", position: "Pivot" },
      ],
    });
    await prisma.match.create({
      data: {
        startsAt: new Date("2026-11-21T13:00:00+01:00"),
        poule: "Poule A",
        teamAId: teamA.id,
        teamBId: teamB.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
