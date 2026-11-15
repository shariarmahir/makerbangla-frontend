import { readFile } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "@/lib/admin/db";

/** Serves images uploaded from the dashboard (`.data/media`). Names are random hex, so they're cached forever. */
export async function GET(_: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  if (!/^[a-f0-9]{32}\.webp$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(dataDir, "media", file));
    return new Response(body, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
