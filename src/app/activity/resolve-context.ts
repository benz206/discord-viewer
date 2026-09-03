import "server-only";

import { getChannel, getChannelDisplayName } from "@/lib/data/channels";
import { getMessage } from "@/lib/data/messages";
import { listGuilds } from "@/lib/data/servers";
import type { ActivityEventRow } from "@/lib/data/types";
import type { ActivityContext, ActivityChannelRef } from "@/components/activity/context";

function channelRef(id: string): ActivityChannelRef | null {
  const channel = getChannel(id);
  if (!channel) return null;
  return {
    id: channel.id,
    name: getChannelDisplayName(channel),
    guildId: channel.guildId,
    type: channel.type,
  };
}

export function resolveActivityContext(events: ActivityEventRow[]): ActivityContext {
  const context: ActivityContext = { guilds: {}, channels: {}, messages: {} };

  const channelIds = new Set<string>();
  const messageIds = new Set<string>();
  for (const event of events) {
    if (event.channelId) channelIds.add(event.channelId);
    if (event.messageId) messageIds.add(event.messageId);
  }

  for (const guild of listGuilds()) {
    context.guilds[guild.id] = guild.name;
  }

  for (const id of messageIds) {
    const message = getMessage(id);
    if (!message) continue;
    context.messages[id] = { id, channelId: message.channelId, ts: message.ts };
    channelIds.add(message.channelId);
  }

  for (const id of channelIds) {
    const ref = channelRef(id);
    if (ref) context.channels[id] = ref;
  }

  return context;
}
