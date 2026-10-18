// Downloads every photo (full size) plus a metadata CSV into ./photo-archive.
// Read-only: nothing is deleted. Run with:
// node --env-file=.env.production.local scripts/archive-photos-prod.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL missing");

const db = createClient({ url, authToken });
const outDir = join(process.cwd(), "photo-archive");
await mkdir(outDir, { recursive: true });

const { rows } = await db.execute(
  `SELECT "id", "url", "uploaderName", "shareable", "status", "reportedAt", "createdAt" FROM "Photo" ORDER BY "createdAt"`,
);

const csv = ["file,uploaderName,shareable,status,reported,createdAt"];
const quote = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
let failed = 0;

for (const [i, row] of rows.entries()) {
  const file = `${String(i + 1).padStart(4, "0")}-${row.id}.jpg`;
  try {
    const res = await fetch(row.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(join(outDir, file), Buffer.from(await res.arrayBuffer()));
  } catch (error) {
    failed++;
    console.error(`Failed ${row.id}: ${error.message}`);
  }
  csv.push(
    [file, row.uploaderName, row.shareable ? "yes" : "no", row.status, row.reportedAt ? "yes" : "no", row.createdAt]
      .map(quote)
      .join(","),
  );
}

await writeFile(join(outDir, "photos.csv"), csv.join("\n") + "\n");
console.log(`Archived ${rows.length - failed} of ${rows.length} photos to ${outDir}`);
