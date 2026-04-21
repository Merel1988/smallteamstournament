import { prisma } from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif",
        ],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: clientPayload ?? null,
      }),
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let uploaderName: string | null = null;
        let caption: string | null = null;
        if (tokenPayload) {
          try {
            const meta = JSON.parse(tokenPayload) as {
              uploaderName?: string;
              caption?: string;
            };
            uploaderName = meta.uploaderName ?? null;
            caption = meta.caption ?? null;
          } catch {}
        }
        await prisma.photo.create({
          data: { url: blob.url, uploaderName, caption },
        });
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "upload failed" },
      { status: 400 },
    );
  }
}

export async function GET() {
  const photos = await prisma.photo
    .findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    .catch(() => []);
  return Response.json({ photos });
}
