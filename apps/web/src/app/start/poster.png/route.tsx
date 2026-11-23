import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Vertical 9:16 presentation image for Enturma and the Mostra+ showcase. */
export async function GET() {
  const image = await readFile(
    join(process.cwd(), "public/start/enturma-apresentacao-9x16.png"),
  );

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
