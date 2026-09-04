import "server-only";

import fs from "node:fs";
import path from "node:path";
import { PACKAGE_DIR } from "./db";
import { resolvePackagePath } from "./package-path";
import type { ResolvedAsset } from "./types";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".csv": "text/csv",
  ".txt": "text/plain",
};

export function resolvePackageAsset(relativePath: string): ResolvedAsset | null {
  const decoded = (() => {
    try {
      return decodeURIComponent(relativePath);
    } catch {
      return relativePath;
    }
  })();
  if (decoded.includes("\0")) return null;

  const requested = path.resolve(PACKAGE_DIR, decoded.replace(/^\/+/, ""));
  const root = path.resolve(PACKAGE_DIR);
  if (requested !== root && !requested.startsWith(`${root}${path.sep}`)) return null;

  // The traversal guard above already pinned the path inside the package, so it
  // is safe to re-resolve it case-insensitively for packages whose folders are
  // capitalized ("Account/") while our links are lowercase.
  const absolute = resolvePackagePath(root, path.relative(root, requested));

  let stats: fs.Stats;
  try {
    stats = fs.statSync(absolute);
  } catch {
    return null;
  }
  if (!stats.isFile()) return null;

  return {
    absolutePath: absolute,
    relativePath: path.relative(root, absolute).split(path.sep).join("/"),
    mimeType: MIME_TYPES[path.extname(absolute).toLowerCase()] ?? "application/octet-stream",
    size: stats.size,
  };
}
