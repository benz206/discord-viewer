// Exercises every exported data-layer function against data/index.db.
// Run with `bun run smoke` (needs --conditions=react-server so `server-only` resolves to a no-op).

import {
  auditLogActionName,
  buildUserDirectory,
  channelTypeName,
  countActivityEvents,
  countUsers,
  getActivityDaily,
  getActivityEvent,
  getActivitySources,
  getApplications,
  getAttachmentStats,
  getChannel,
  getChannelDisplayName,
  getGuild,
  getMessage,
  getMessageCountByDay,
  getMessageCountByGuild,
  getMessages,
  getMessagesAround,
  getOwnerId,
  getPackageStats,
  getUser,
  getUserAvatarPath,
  getUserEntry,
  getUserNotes,
  isValidActivityCursor,
  listActivityDomains,
  listActivityEventTypes,
  listActivityEvents,
  listChannels,
  listChannelsForUser,
  listGuilds,
  listGuildsWithChannels,
  listUsers,
  resolvePackageAsset,
  searchMessages,
  toFtsQuery,
} from "../src/lib/data";

function check(label: string, value: unknown): void {
  process.stdout.write(`${label.padEnd(38)} ${JSON.stringify(value)}\n`);
}

function timed<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  process.stdout.write(`${label.padEnd(38)} ${(performance.now() - start).toFixed(1)}ms\n`);
  return result;
}

function main(): void {
  const stats = getPackageStats();
  check("getPackageStats", stats);

  const user = getUser();
  check("getUser", user ? { id: user.id, username: user.username, relationships: user.relationships.length } : null);
  check("getOwnerId", getOwnerId());
  check("getUserAvatarPath", getUserAvatarPath());
  check("getApplications", getApplications().map((entry) => entry.application.name));
  check("getActivitySources", getActivitySources());

  const guilds = timed("listGuilds", () => listGuilds());
  check("listGuilds.length", guilds.length);
  const richGuild = guilds.find((guild) => guild.hasChannels) ?? guilds[0];
  const guild = getGuild(richGuild.id);
  check("getGuild", {
    id: guild?.id,
    name: guild?.name,
    roles: guild?.guild?.roles ? Object.keys(guild.guild.roles).length : 0,
    channels: guild?.channels?.length ?? 0,
    auditLog: guild?.auditLog?.length ?? 0,
    bans: guild?.bans?.length ?? 0,
    emoji: guild?.emoji?.length ?? 0,
    webhooks: guild?.webhooks?.length ?? 0,
    assets: {
      icon: guild?.assets.icon,
      emoji: guild?.assets.emoji.length ?? 0,
      webhookAvatars: guild?.assets.webhookAvatars.length ?? 0,
    },
  });
  if (guild?.auditLog?.[0]) check("auditLogActionName", auditLogActionName(guild.auditLog[0].action_type));

  const channels = timed("listChannels", () => listChannels({ withMessagesOnly: true, limit: 5 }));
  check(
    "listChannels",
    channels.map((channel) => ({ id: channel.id, name: getChannelDisplayName(channel), n: channel.messageCount })),
  );
  check("listChannels.dm", listChannels({ dm: true, withMessagesOnly: true, limit: 3 }).map((c) => c.indexName));
  check("listChannels.guild", listChannels({ guildId: richGuild.id, limit: 3 }).map((c) => c.name));
  check("listChannels.groupDm", listChannels({ groupDm: true, limit: 3 }).map((c) => c.indexName ?? c.name));
  check("listChannels.recent", listChannels({ orderBy: "recent", limit: 3 }).map((c) => c.lastTs));
  check("listChannels.search", listChannels({ orderBy: "name", search: "general", limit: 3 }).map((c) => c.name));
  check("channelTypeName", [0, 1, 3, 11].map(channelTypeName));

  const groups = timed("listGuildsWithChannels", () => listGuildsWithChannels({ withMessagesOnly: true }));
  check(
    "listGuildsWithChannels",
    groups.slice(0, 5).map((group) => ({ kind: group.kind, name: group.name, channels: group.channels.length, n: group.messageCount })),
  );

  const busiest = channels[0];
  check("getChannel", getChannel(busiest.id)?.messageCount);

  const firstPage = timed("getMessages", () => getMessages(busiest.id, { limit: 25 }));
  check("getMessages", { n: firstPage.messages.length, next: firstPage.nextCursor, newest: firstPage.messages[0]?.contents.slice(0, 40) });
  const secondPage = getMessages(busiest.id, { before: firstPage.nextCursor ?? undefined, limit: 25 });
  check("getMessages.before", { n: secondPage.messages.length, next: secondPage.nextCursor });
  const backPage = getMessages(busiest.id, { after: secondPage.prevCursor ?? undefined, limit: 25 });
  check("getMessages.after", { n: backPage.messages.length, matchesFirst: backPage.messages[0]?.id === firstPage.messages[0]?.id });

  const sample = firstPage.messages[0];
  check("getMessage", getMessage(sample.id)?.id);
  const around = timed("getMessagesAround", () => getMessagesAround(sample.id, 10));
  check("getMessagesAround", { n: around.messages.length, contains: around.messages.some((m) => m.id === sample.id) });

  check("toFtsQuery", toFtsQuery('hello "the world" pre*'));
  const search = timed("searchMessages", () => searchMessages("hello", { limit: 5 }));
  check("searchMessages", { total: search.total, first: search.hits[0]?.snippet, channel: search.hits[0]?.channelName });
  check("searchMessages.channel", searchMessages("the", { channelId: busiest.id, limit: 1 }).total);
  check("searchMessages.guild", searchMessages("the", { guildId: richGuild.id, limit: 1 }).total);
  check("searchMessages.relevance", searchMessages("discord bot", { order: "relevance", limit: 1 }).hits.length);

  const days = timed("getMessageCountByDay", () => getMessageCountByDay());
  check("getMessageCountByDay", { days: days.length, first: days[0], last: days[days.length - 1] });
  check("getMessageCountByDay(channel)", getMessageCountByDay(busiest.id).length);
  check("getMessageCountByGuild", getMessageCountByGuild().slice(0, 5));
  check("getMessageCountByGuild.kinds", [...new Set(getMessageCountByGuild().map((row) => row.kind))]);
  check("getAttachmentStats", getAttachmentStats());

  check("listActivityDomains", listActivityDomains());
  const types = timed("listActivityEventTypes", () => listActivityEventTypes());
  check("listActivityEventTypes", { n: types.length, top: types.slice(0, 5) });

  const events = timed("listActivityEvents", () => listActivityEvents({ limit: 5 }));
  check("listActivityEvents", { n: events.events.length, next: events.nextCursor, first: events.events[0] });
  const nextEvents = listActivityEvents({ limit: 5, cursor: events.nextCursor ?? undefined });
  check("listActivityEvents.cursor", { n: nextEvents.events.length, distinct: nextEvents.events[0]?.id !== events.events[0]?.id });
  check("listActivityEvents.filtered", listActivityEvents({ domain: "Tns", eventType: "add_reaction", limit: 3 }).events.map((e) => e.summary));
  check(
    "listActivityEvents.guild",
    listActivityEvents({ guildId: richGuild.id, limit: 2 }).events.map((e) => e.eventType),
  );
  check("countActivityEvents", countActivityEvents({ domain: "Tns", eventType: "send_message" }));
  const withMessage = listActivityEvents({ eventType: "send_message", limit: 1 }).events[0];
  check("countActivityEvents.messageId", {
    messageId: withMessage?.messageId,
    channelId: withMessage?.channelId,
    n: countActivityEvents({ messageId: withMessage?.messageId ?? "" }),
  });
  check("isValidActivityCursor", ["1:2", "NaN:2", "1:x", "1", "1:2:3"].map(isValidActivityCursor));
  let cursorRejected = false;
  try {
    listActivityEvents({ cursor: "NaN:NaN" });
  } catch {
    cursorRejected = true;
  }
  check("listActivityEvents.badCursor", cursorRejected);

  const raw = timed("getActivityEvent", () => getActivityEvent(events.events[0].id));
  check("getActivityEvent", {
    id: raw?.event.id,
    eventType: raw?.event.eventType,
    rawKeys: raw ? Object.keys(raw.raw).length : 0,
    rawEventType: raw?.raw.event_type,
    matches: raw?.raw.event_type === raw?.event.eventType,
  });

  const daily = timed("getActivityDaily", () => getActivityDaily({ domain: "Reporting" }));
  check("getActivityDaily", { days: daily.length, first: daily[0], last: daily[daily.length - 1] });

  const directory = timed("buildUserDirectory", () => buildUserDirectory());
  check("buildUserDirectory", { size: directory.size, named: [...directory.values()].filter((entry) => entry.name).length });
  const named = listUsers({ namedOnly: true, limit: 3 });
  check("listUsers", named);
  check("listUsers.source", listUsers({ source: "ban", limit: 3 }).map((entry) => entry.id));
  check("countUsers", { all: countUsers(), named: countUsers({ namedOnly: true }), bans: countUsers({ source: "ban" }) });
  check("getUserEntry", getUserEntry(named[0]?.id ?? ""));
  check("getUserNotes", getUserNotes().slice(0, 2));
  const dmPartner = listChannels({ dm: true, withMessagesOnly: true, limit: 1 })[0]?.recipients?.[0] ?? "";
  check(
    "listChannelsForUser",
    listChannelsForUser(dmPartner).map((channel) => ({ id: channel.id, type: channel.type, n: channel.messageCount })),
  );

  check("resolvePackageAsset", resolvePackageAsset("account/avatar.gif"));
  check("resolvePackageAsset(guild icon)", guild?.assets.icon ? resolvePackageAsset(guild.assets.icon)?.mimeType : null);
  check("resolvePackageAsset(emoji)", guild?.assets.emoji[0] ? resolvePackageAsset(guild.assets.emoji[0].path)?.relativePath : null);
  check("resolvePackageAsset(traversal)", resolvePackageAsset("../../package.json"));
  check("resolvePackageAsset(absolute)", resolvePackageAsset("/etc/passwd"));
  check("resolvePackageAsset(missing)", resolvePackageAsset("account/nope.png"));

  process.stdout.write("\nsmoke ok\n");
}

main();
