#!/usr/bin/env tsx
// Crawls the running app from "/" and reports broken pages.
// Usage: pnpm crawl [baseUrl] [--max=3000] [--per-pattern=30] [--concurrency=8]

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};

const BASE = (args.find((arg) => !arg.startsWith("--")) ?? "http://localhost:3040").replace(/\/$/, "");
const MAX_PAGES = flag("max", 3000);
const PER_PATTERN = flag("per-pattern", 30);
const CONCURRENCY = flag("concurrency", 8);

const ERROR_MARKERS = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "This page could not be found",
];

const stripScripts = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

type Failure = { url: string; from: string; status: number; reason: string };

const seen = new Set<string>();
const patternCounts = new Map<string, number>();
const failures: Failure[] = [];
const queue: { url: string; from: string }[] = [];
let visited = 0;

function patternOf(url: URL) {
  const path = url.pathname
    .split("/")
    .map((segment) => (/^\d+$/.test(segment) || /^[0-9a-f]{16,}$/i.test(segment) ? ":id" : segment))
    .join("/");
  const keys = [...new Set([...url.searchParams.keys()])].sort().join(",");
  return keys ? `${path}?${keys}` : path;
}

function enqueue(href: string, from: string) {
  let url: URL;
  try {
    url = new URL(href, BASE);
  } catch {
    return;
  }
  if (url.origin !== new URL(BASE).origin) return;
  url.hash = "";
  const key = url.pathname + url.search;
  if (seen.has(key)) return;

  const pattern = patternOf(url);
  const count = patternCounts.get(pattern) ?? 0;
  if (count >= PER_PATTERN) return;
  patternCounts.set(pattern, count + 1);

  seen.add(key);
  queue.push({ url: key, from });
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  "#x27": "'",
};

function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, name: string) => {
    const direct = ENTITIES[name.toLowerCase()];
    if (direct) return direct;
    if (/^#x/i.test(name)) return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)));
    return whole;
  });
}

function extractLinks(html: string) {
  const hrefs: string[] = [];
  const re = /<a\b[^>]*?\shref=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) hrefs.push(decodeEntities(match[1]));
  return hrefs;
}

async function visit(target: { url: string; from: string }) {
  const isAsset = target.url.startsWith("/api/asset/");
  let response: Response;
  try {
    response = await fetch(BASE + target.url, {
      redirect: "follow",
      headers: { accept: isAsset ? "*/*" : "text/html" },
    });
  } catch (error) {
    failures.push({
      url: target.url,
      from: target.from,
      status: 0,
      reason: `fetch failed: ${(error as Error).message}`,
    });
    return;
  }

  visited += 1;
  if (!response.ok) {
    failures.push({ url: target.url, from: target.from, status: response.status, reason: "non-200" });
    await response.arrayBuffer().catch(() => undefined);
    return;
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) {
    await response.arrayBuffer().catch(() => undefined);
    return;
  }

  const html = await response.text();
  const visible = stripScripts(html);
  const marker = ERROR_MARKERS.find((needle) => visible.includes(needle));
  if (marker) {
    failures.push({ url: target.url, from: target.from, status: response.status, reason: `body: ${marker}` });
    return;
  }
  for (const href of extractLinks(html)) enqueue(href, target.url);
}

async function main() {
  enqueue("/", "(root)");

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0 && visited < MAX_PAGES) {
      const next = queue.shift();
      if (!next) break;
      await visit(next);
      if (visited % 100 === 0) process.stdout.write(`\r  visited ${visited}, queued ${queue.length}`);
    }
  });
  await Promise.all(workers);

  process.stdout.write("\r".padEnd(48) + "\r");
  console.log(`crawled ${visited} pages across ${patternCounts.size} route patterns`);
  const top = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [pattern, count] of top) console.log(`  ${String(count).padStart(4)}  ${pattern}`);

  if (failures.length === 0) {
    console.log("\nno failures");
    return;
  }
  console.log(`\n${failures.length} failures:`);
  for (const failure of failures) {
    console.log(`  [${failure.status}] ${failure.url}\n        ${failure.reason} (linked from ${failure.from})`);
  }
  process.exitCode = 1;
}

void main();
