import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type SendResult = {
  sent: number;
  removed: number;
  failed: number;
  /** Human-readable, deduped summaries of the failures that were not "gone" (404/410). */
  errors: string[];
};

export async function sendToAll(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<SendResult> {
  configureWebPush();
  const subs = await prisma.pushSubscription.findMany();
  let sent = 0;
  let removed = 0;
  let failed = 0;
  const errorCounts = new Map<string, number>();
  const data = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data,
      );
      sent++;
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? (error as { statusCode?: number }).statusCode
          : undefined;

      // 404 (Not Found) and 410 (Gone) both mean the subscription is dead:
      // remove it so we stop trying. Everything else is a real failure we surface.
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        removed++;
      } else {
        failed++;
        const message =
          error && typeof error === "object" && "body" in error
            ? String((error as { body?: unknown }).body || "").trim()
            : error instanceof Error
              ? error.message
              : String(error);
        const key = `${statusCode ?? "?"}: ${message || "onbekende fout"}`;
        errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const errors = [...errorCounts.entries()].map(([msg, count]) =>
    count > 1 ? `${msg} (${count}×)` : msg,
  );

  return { sent, removed, failed, errors };
}
