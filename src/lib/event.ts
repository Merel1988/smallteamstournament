export const MATCH_MINUTES = 20;
// Each team gets its own warm-up slot on the side track before a game, one team at a time.
export const WARMUP_MINUTES = 10;
// Rest between the last warm-up and the game.
export const WARMUP_GAP_MINUTES = 5;

export const EVENT = {
  name: "Small Teams Tournament",
  league: "Roadkill Rollers Nijmegen",
  date: new Date("2026-11-21T12:00:00+01:00"),
  endDate: new Date("2026-11-21T18:00:00+01:00"),
  venue: "Sportzaal De Horstacker",
  city: "Nijmegen",
  address: "Horstacker 1401, 6546 EK Nijmegen",
  street: "Horstacker 1401",
  postalCode: "6546 EK",
  country: "NL",
  description:
    "Max 8 teams van 8 spelers (co-ed mogelijk). Korte intensieve bouts van 20 minuten. Voorrang voor kleinere leagues — dit is een leertoernooi.",
} as const;
