// Shared between server and client components: no Prisma imports here.

export type ProgramEntry = {
  id: string;
  start: number;
  end: number | null;
  title: string;
  note: string | null;
  kind: "item" | "match" | "break";
};
