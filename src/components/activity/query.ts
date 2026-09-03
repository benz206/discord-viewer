export type Granularity = "day" | "month";

export interface ActivityQuery {
  domain?: string;
  eventType?: string;
  from?: string;
  to?: string;
  guildId?: string;
  channelId?: string;
  messageId?: string;
  granularity?: Granularity;
  event?: string;
}

export const ACTIVITY_FILTER_KEYS = [
  "domain",
  "eventType",
  "from",
  "to",
  "guildId",
  "channelId",
  "messageId",
] as const;

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  const trimmed = text?.trim();
  return trimmed ? trimmed : undefined;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseActivityQuery(params: RawSearchParams): ActivityQuery {
  const from = first(params.from);
  const to = first(params.to);
  const granularity = first(params.granularity);
  return {
    domain: first(params.domain),
    eventType: first(params.eventType),
    from: from && DAY_PATTERN.test(from) ? from : undefined,
    to: to && DAY_PATTERN.test(to) ? to : undefined,
    guildId: first(params.guildId),
    channelId: first(params.channelId),
    messageId: first(params.messageId),
    granularity: granularity === "day" || granularity === "month" ? granularity : undefined,
    event: first(params.event),
  };
}

export function activityQueryString(query: ActivityQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function activityHref(query: ActivityQuery): string {
  return `/activity${activityQueryString(query)}`;
}

export function hasActivityFilters(query: ActivityQuery): boolean {
  return ACTIVITY_FILTER_KEYS.some((key) => Boolean(query[key]));
}

export function dayStartMs(day: string | undefined): number | undefined {
  return day ? Date.parse(`${day}T00:00:00.000Z`) : undefined;
}

export function dayEndMs(day: string | undefined): number | undefined {
  return day ? Date.parse(`${day}T23:59:59.999Z`) : undefined;
}

export function pickGranularity(query: ActivityQuery, dayCount: number): Granularity {
  if (query.granularity) return query.granularity;
  return dayCount > 400 ? "month" : "day";
}
