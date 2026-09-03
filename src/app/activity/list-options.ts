import type { ListActivityEventsOptions } from "@/lib/data/activity";
import { dayEndMs, dayStartMs, type ActivityQuery } from "@/components/activity/query";

export const EVENT_PAGE_SIZE = 100;

export function listOptionsFor(
  query: ActivityQuery,
  extra: { cursor?: string; limit?: number } = {},
): ListActivityEventsOptions {
  return {
    domain: query.domain,
    eventType: query.eventType,
    from: dayStartMs(query.from),
    to: dayEndMs(query.to),
    guildId: query.guildId,
    channelId: query.channelId,
    messageId: query.messageId,
    cursor: extra.cursor,
    limit: extra.limit ?? EVENT_PAGE_SIZE,
  };
}

export function apiQueryString(query: ActivityQuery): string {
  const params = new URLSearchParams();
  for (const key of ["domain", "eventType", "from", "to", "guildId", "channelId", "messageId"] as const) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  return params.toString();
}
