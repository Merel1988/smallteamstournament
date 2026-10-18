import { generateText, Output } from "ai";
import { z } from "zod";

const MODEL = "anthropic/claude-haiku-5.5";

const PROMPT = `You moderate photos for the public gallery of a roller derby tournament website.
Roller derby photos normally show skaters in tight sportswear, fishnets, shorts, helmets,
bruises, falls and physical contact. All of that is fine.

Reject the photo only if it contains any of:
- nudity: visible genitals, bare buttocks, or exposed female nipples
- sexual acts or sexually explicit poses
- graphic gore or serious bloody injuries
- hate symbols or extremist imagery
- drug use

Reply with allowed=false when in doubt about any of these. Keep the reason short and in Dutch.`;

export type ModerationResult = { allowed: boolean; note: string };

export async function moderatePhoto(image: Uint8Array): Promise<ModerationResult> {
  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({
        schema: z.object({
          allowed: z.boolean(),
          reason: z.string(),
        }),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "file", mediaType: "image/jpeg", data: image },
          ],
        },
      ],
      providerOptions: {
        gateway: { zeroDataRetention: process.env.PHOTO_MODERATION_ZDR === "1" },
      },
      maxRetries: 2,
    });
    return { allowed: output.allowed, note: output.reason };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { allowed: false, note: `Automatische controle mislukt: ${message.slice(0, 200)}` };
  }
}
