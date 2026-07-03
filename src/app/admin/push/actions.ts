"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { sendToAll } from "@/lib/push";
import { revalidatePath } from "next/cache";

export type PushFormState =
  | { ok: true; sent: number; removed: number; failed: number; errors: string[] }
  | { ok: false; error: string }
  | null;

export async function sendPush(
  _prevState: PushFormState,
  formData: FormData,
): Promise<PushFormState> {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const url = String(formData.get("url") || "").trim() || undefined;
  if (!title || !body) {
    return { ok: false, error: "Titel en berichttekst zijn verplicht." };
  }

  try {
    const result = await sendToAll({ title, body, url });
    revalidatePath("/admin/push");
    return { ok: true, ...result };
  } catch (error: unknown) {
    // configureWebPush() throws when the VAPID env vars are missing — surface
    // that instead of failing silently.
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error:
        message === "VAPID keys not configured"
          ? "VAPID-sleutels ontbreken op de server. Controleer de env vars in Vercel."
          : `Versturen mislukt: ${message}`,
    };
  }
}
