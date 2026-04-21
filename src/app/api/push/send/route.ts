import { isAdmin } from "@/lib/admin-auth";
import { sendToAll } from "@/lib/push";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, url, tag } = await request.json();
  if (!title || !body) {
    return Response.json({ error: "title and body required" }, { status: 400 });
  }

  try {
    const result = await sendToAll({ title, body, url, tag });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "send failed" },
      { status: 500 },
    );
  }
}
