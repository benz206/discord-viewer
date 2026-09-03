const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}

export function formatDate(ts: number | null | undefined): string {
  return ts ? DATE_FORMAT.format(new Date(ts)) : "—";
}

export function formatDateTime(ts: number | null | undefined): string {
  return ts ? DATE_TIME_FORMAT.format(new Date(ts)) : "—";
}
