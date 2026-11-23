// Shapes of an archived edition. No Prisma import, so client components can use these.

export type EditionPlayer = {
  number: string;
  derbyName: string;
  pronouns: string | null;
  headshotUrl: string | null;
};

export type EditionTeam = {
  key: string;
  name: string;
  color: string | null;
  logoUrl: string | null;
  descriptionNl: string | null;
  descriptionEn: string | null;
  players: EditionPlayer[];
  benchStaff: { name: string; role: string; pronouns: string | null }[];
};

export type EditionMatch = {
  startsAt: string;
  poule: string | null;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
};

export type EditionSnapshot = {
  year: number;
  takenAt: string;
  teams: EditionTeam[];
  matches: EditionMatch[];
};

// A skater on a leaderboard: team key plus jersey number, the name comes from the snapshot.
export type SkaterEntry = { team: string; number: string; value: number; pivotPoints?: number };

export type SkaterBoardKey =
  | "points"
  | "pointsPerJam"
  | "leadPct"
  | "jammerPlusMinus"
  | "blockerPlusMinus"
  | "bestJam"
  | "timeToLead";

export type SkaterBoard = {
  key: SkaterBoardKey;
  format: "int" | "dec2" | "pct" | "plus" | "seconds";
  rows: SkaterEntry[];
};

export type TeamStats = {
  team: string;
  games: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: number;
  jams: number;
  leadPct: number;
  pointsPerJam: number;
  starPasses: number;
  penalties: number;
  penaltiesPerGame: number;
  timeToLead: number;
};

export type GameStats = {
  n: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  jams: number;
  leadChanges: number;
  comeback: number;
  penaltiesA: number;
  penaltiesB: number;
  minutes: number;
  avgJam: string;
  avgLineup: number;
  timeouts: number;
};

export type EditionStats = {
  pdfUrl: string;
  overview: {
    games: number;
    jams: number;
    pointsPerGame: number;
    penaltiesPerGame: number;
    leadJammerPct: number;
    starPasses: number;
    avgJam: string;
  };
  skaterBoards: SkaterBoard[];
  teams: TeamStats[];
  games: GameStats[];
  jamScores: [string, number][];
  penaltyCodes: [string, number][];
  jamEndings: [string, number][];
  timing: {
    medianJam: string;
    meanTimeToLead: string;
    medianTimeToLead: string;
    avgLineup: number;
    gameMinutes: number;
    meanCallOff: string;
    medianCallOff: string;
    teamTimeouts: number;
    officialTimeouts: number;
    officialReviews: number;
  };
};

export type Edition = { snapshot: EditionSnapshot; stats: EditionStats | null };
