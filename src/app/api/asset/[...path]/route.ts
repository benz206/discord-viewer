import fs from "node:fs";
import { Readable } from "node:stream";

import { resolvePackageAsset } from "@/lib/data/assets";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const asset = resolvePackageAsset(path.join("/"));

  if (!asset) {
    return new Response("Asset not found", {
      status: 404,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const body = Readable.toWeb(
    fs.createReadStream(asset.absolutePath),
  ) as unknown as ReadableStream<Uint8Array>;

  return new Response(body, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${asset.relativePath.split("/").pop() ?? "asset"}"`,
    },
  });
}
