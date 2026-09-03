import { notFound } from "next/navigation";

import { getChannel } from "@/lib/data/channels";
import { readPackageJson } from "@/lib/data/db";
import { resolvePackageAsset } from "@/lib/data/assets";
import { getMessage, getMessageCountByDay, getMessages, getMessagesAround } from "@/lib/data/messages";
import { getOwnerId, getUser, getUserAvatarPath } from "@/lib/data/meta";
import { getGuild } from "@/lib/data/servers";
import { getUserEntry } from "@/lib/data/users";
import { channelTypeName, type ChannelRow, type PackageChannelJson } from "@/lib/data/types";
import { buildResolverMap, channelLabel } from "@/lib/resolvers";
import { channelKindFromType } from "@/components/layout/channel-icon";
import { ChannelView, type ChannelRecipient } from "@/components/app/channel-view";
import { bucketDays } from "@/components/app/sparkline";

const PAGE_SIZE = 50;
const AROUND_SIZE = 30;

export default async function ChannelMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { guildId, channelId } = await params;
  const guildKey = decodeURIComponent(guildId);
  const { message } = await searchParams;

  const stored = getChannel(channelId);
  const lookupGuildId =
    stored?.guildId ?? (guildKey !== "@me" && guildKey !== "unknown" ? guildKey : null);
  const guild = lookupGuildId ? getGuild(lookupGuildId) : null;
  const guildChannel = guild?.channels?.find((entry) => entry.id === channelId) ?? null;
  if (!stored && !guildChannel) notFound();

  const channel: ChannelRow = stored ?? {
    id: channelId,
    name: guildChannel?.name ?? null,
    type: guildChannel?.type ?? 0,
    guildId: lookupGuildId,
    guildName: guild?.name ?? null,
    indexName: null,
    recipients: null,
    messageCount: 0,
    firstTs: null,
    lastTs: null,
  };

  const requested = typeof message === "string" ? message : null;
  const target = requested ? getMessage(requested) : null;
  const highlightId = target && target.channelId === channelId ? target.id : null;

  const page = highlightId
    ? getMessagesAround(highlightId, AROUND_SIZE)
    : getMessages(channelId, { limit: PAGE_SIZE });

  const index = highlightId ? page.messages.findIndex((row) => row.id === highlightId) : -1;
  const initialHasNewer = index >= 0 ? index >= AROUND_SIZE : false;
  const initialHasOlder =
    index >= 0
      ? page.messages.length - index - 1 >= AROUND_SIZE
      : page.messages.length === PAGE_SIZE;

  const messages = page.messages.slice().reverse();
  const ownerId = getOwnerId();
  const owner = getUser();

  const channelJson = readPackageJson<PackageChannelJson>(
    "messages",
    `c${channelId}`,
    "channel.json",
  );

  const recipientIds =
    channel.recipients?.filter((id) => id !== ownerId) ?? channelJson?.recipients ?? [];

  const recipients: ChannelRecipient[] = recipientIds.map((id) => {
    const entry = getUserEntry(id);
    return {
      id,
      name: entry?.name ?? null,
      discriminator: entry?.discriminator ?? null,
      avatar: entry?.avatar ?? null,
      sources: entry?.sources ?? [],
    };
  });

  const directoryName = recipients.length === 1 ? recipients[0].name : null;

  const csv = resolvePackageAsset(`messages/c${channelId}/messages.csv`);
  const json = resolvePackageAsset(`messages/c${channelId}/channel.json`);
  const days = getMessageCountByDay(channelId);
  const avatarPath = getUserAvatarPath();

  return (
    <ChannelView
      channelId={channelId}
      name={channelLabel(channel, directoryName)}
      kind={channelKindFromType(channel.type)}
      topic={guildChannel?.topic ?? null}
      typeName={channelTypeName(channel.type)}
      guildName={channel.guildName ?? guild?.name ?? null}
      guildHref={channel.guildId ? `/channels/${channel.guildId}` : null}
      messageCount={channel.messageCount}
      firstTs={channel.firstTs}
      lastTs={channel.lastTs}
      activeDays={days.length}
      spark={bucketDays(days)}
      channelJson={channelJson ?? guildChannel}
      recipients={recipients}
      csvPath={csv?.relativePath ?? null}
      csvSize={csv?.size ?? null}
      jsonPath={json?.relativePath ?? null}
      author={{
        id: owner?.id ?? ownerId ?? "owner",
        name: owner?.username ?? "You",
        avatarUrl: avatarPath ? `/api/asset/${avatarPath}` : null,
      }}
      initialMessages={messages}
      initialResolvers={buildResolverMap(
        messages.map((row) => row.contents),
        lookupGuildId,
      )}
      initialHasOlder={initialHasOlder}
      initialHasNewer={initialHasNewer}
      highlightId={highlightId}
    />
  );
}
