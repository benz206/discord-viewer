const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return NUMBER_FORMAT.format(value);
}

export function assetUrl(packagePath: string): string {
  return `/api/asset/${packagePath.split("/").map(encodeURIComponent).join("/")}`;
}

export function roleColor(color: number | null | undefined): string | null {
  if (!color) return null;
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function snowflakeDate(id: string | null | undefined): Date | null {
  if (!id || !/^\d+$/.test(id)) return null;
  const ms = Number((BigInt(id) >> BigInt(22)) + BigInt(1420070400000));
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : null;
}

export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds === 0) return "Off";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr`;
}

export function formatBitrate(bitrate: number | null | undefined): string {
  if (!bitrate) return "—";
  return `${Math.round(bitrate / 1000)} kbps`;
}
