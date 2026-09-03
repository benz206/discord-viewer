const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatTimestamp(ms: number | null | undefined): string {
  return ms === null || ms === undefined ? "—" : formatDateTime(new Date(ms).toISOString());
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}:\d{2})/.test(value);
}

export function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size < 10 && unit > 0 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

export function formatMoney(amount: number, currency: string): string {
  const value = (amount / 100).toFixed(2);
  return currency.toLowerCase() === "usd" ? `$${value} USD` : `${value} ${currency.toUpperCase()}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${formatNumber(hours)}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (rest > 0 || parts.length === 0) parts.push(`${rest}s`);
  return parts.join(" ");
}

const ACRONYMS = new Set([
  "id",
  "ids",
  "ip",
  "url",
  "urls",
  "uri",
  "uris",
  "sku",
  "mfa",
  "os",
  "dm",
  "rpc",
  "tts",
  "nsfw",
  "gif",
  "api",
  "utc",
  "cdn",
  "json",
  "csv",
  "afk",
]);

export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(" ");
}

export function discriminatorTag(discriminator: unknown): string {
  return `#${String(discriminator ?? "0000").padStart(4, "0")}`;
}

export function discordAvatarUrl(id: string, hash: string | null | undefined, size = 128): string | null {
  if (!hash) return null;
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=${size}`;
}

export type Rec = Record<string, unknown>;

export function asRecord(value: unknown): Rec {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Rec) : {};
}

export function asRecords(value: unknown): Rec[] {
  return Array.isArray(value) ? value.map((entry) => asRecord(entry)) : [];
}
