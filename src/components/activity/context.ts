export interface ActivityChannelRef {
  id: string;
  name: string;
  guildId: string | null;
  type: number;
}

export interface ActivityMessageRef {
  id: string;
  channelId: string;
  ts: number;
}

export interface ActivityContext {
  guilds: Record<string, string>;
  channels: Record<string, ActivityChannelRef>;
  messages: Record<string, ActivityMessageRef>;
}

export const EMPTY_CONTEXT: ActivityContext = { guilds: {}, channels: {}, messages: {} };

export function guildHref(guildId: string): string {
  return `/channels/${guildId}`;
}

export function serverHref(guildId: string): string {
  return `/servers/${guildId}`;
}

export function channelHref(channelId: string, guildId: string | null | undefined): string {
  return `/channels/${guildId ?? "@me"}/${channelId}`;
}

export function messageHref(context: ActivityContext, messageId: string): string | null {
  const message = context.messages[messageId];
  if (!message) return null;
  const channel = context.channels[message.channelId];
  return `${channelHref(message.channelId, channel?.guildId ?? null)}?message=${messageId}`;
}

export function channelLabel(context: ActivityContext, channelId: string): string {
  const channel = context.channels[channelId];
  if (!channel) return channelId;
  return channel.name;
}

export function guildLabel(context: ActivityContext, guildId: string): string {
  return context.guilds[guildId] ?? guildId;
}

function idOf(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export interface EffectiveIds {
  guildId: string | null;
  channelId: string | null;
  messageId: string | null;
}

export function effectiveIds(
  event: { guildId: string | null; channelId: string | null; messageId: string | null },
  raw: Record<string, unknown>,
): EffectiveIds {
  return {
    guildId: event.guildId ?? idOf(raw.guild_id) ?? idOf(raw.server),
    channelId: event.channelId ?? idOf(raw.channel_id) ?? idOf(raw.channel),
    messageId: event.messageId ?? idOf(raw.message_id),
  };
}
