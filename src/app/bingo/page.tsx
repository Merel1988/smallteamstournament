import BingoCard from "@/components/BingoCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BingoPage() {
  const prompts = await prisma.bingoPrompt
    .findMany({ where: { active: true }, select: { id: true, text: true } })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl">Derby Bingo</h1>
        <p className="text-derby-ink/70 mt-1">
          Vink vakjes af terwijl je kijkt. 5 op een rij = BINGO! Je voortgang
          blijft bewaard op dit apparaat.
        </p>
      </header>

      <BingoCard prompts={prompts} />
    </div>
  );
}
