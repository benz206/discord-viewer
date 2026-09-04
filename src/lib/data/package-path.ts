// Resolves paths inside the extracted data package.
//
// Discord has shipped both lowercase ("account/", "messages/") and capitalized
// ("Account/", "Messages/") top-level folder names across package versions, so
// every lookup falls back to a case-insensitive match against what is actually
// on disk. That keeps a single set of lowercase call sites working for either
// layout, and on case-sensitive filesystems as well as Windows.

import fs from "node:fs";
import path from "node:path";

const resolved = new Map<string, string>();

function splitSegments(segments: string[]): string[] {
  const parts: string[] = [];
  for (const segment of segments) {
    for (const part of segment.split(/[/\\]+/)) {
      if (part.length > 0) parts.push(part);
    }
  }
  return parts;
}

function resolveSegment(parent: string, segment: string): string {
  const key = `${parent}\u0000${segment}`;
  const cached = resolved.get(key);
  if (cached !== undefined) return cached;

  const direct = path.join(parent, segment);
  let match = direct;
  if (!fs.existsSync(direct)) {
    const lower = segment.toLowerCase();
    let entries: string[];
    try {
      entries = fs.readdirSync(parent);
    } catch {
      entries = [];
    }
    const found = entries.find((entry) => entry.toLowerCase() === lower);
    if (found) match = path.join(parent, found);
  }

  resolved.set(key, match);
  return match;
}

/** Joins `segments` onto `root`, matching existing entries regardless of case. */
export function resolvePackagePath(root: string, ...segments: string[]): string {
  let current = root;
  for (const segment of splitSegments(segments)) {
    current = resolveSegment(current, segment);
  }
  return current;
}
