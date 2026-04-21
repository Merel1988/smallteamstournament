import { prisma } from "@/lib/prisma";

export async function GET() {
  const prompts = await prisma.bingoPrompt
    .findMany({ where: { active: true }, select: { id: true, text: true } })
    .catch(() => []);
  return Response.json({ prompts });
}
