"use client";

import Link from "next/link";

import { channelTypeName, type ActivityEventRow } from "@/lib/data/types";
import { formatDurationMs } from "@/components/activity/format";
import { activityHref } from "@/components/activity/query";
import {
  channelHref,
  guildHref,
  messageHref,
  type ActivityContext,
} from "@/components/activity/context";

type Summary = Record<string, string | number | boolean>;

const linkClass = "text-link hover:underline";

function text(summary: Summary, key: string): string | undefined {
  const value = summary[key];
  return value === undefined || value === "" ? undefined : String(value);
}

function number(summary: Summary, key: string): number | undefined {
  const value = summary[key];
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolvedChannelId(event: ActivityEventRow, context: ActivityContext): string | null {
  if (event.channelId) return event.channelId;
  if (event.messageId) return context.messages[event.messageId]?.channelId ?? null;
  return null;
}

function resolvedGuildId(event: ActivityEventRow, context: ActivityContext): string | null {
  if (event.guildId) return event.guildId;
  const channelId = resolvedChannelId(event, context);
  return channelId ? (context.channels[channelId]?.guildId ?? null) : null;
}

export function ChannelLink({
  event,
  context,
}: {
  event: ActivityEventRow;
  context: ActivityContext;
}) {
  const channelId = resolvedChannelId(event, context);
  if (!channelId) return null;
  const channel = context.channels[channelId];
  const label = channel ? channel.name : channelId;
  return (
    <Link
      href={channel ? channelHref(channelId, channel.guildId) : activityHref({ channelId })}
      className={linkClass}
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      {label}
    </Link>
  );
}

export function GuildLink({
  event,
  context,
}: {
  event: ActivityEventRow;
  context: ActivityContext;
}) {
  const guildId = resolvedGuildId(event, context);
  if (!guildId) return null;
  const known = guildId in context.guilds;
  return (
    <Link
      href={known ? guildHref(guildId) : activityHref({ guildId })}
      className={linkClass}
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      {context.guilds[guildId] ?? guildId}
    </Link>
  );
}

function MessageLink({
  event,
  context,
  label,
}: {
  event: ActivityEventRow;
  context: ActivityContext;
  label: string;
}) {
  if (!event.messageId) return null;
  const href = messageHref(context, event.messageId);
  if (!href) return <span className="text-faint">{label}</span>;
  return (
    <Link
      href={href}
      className={linkClass}
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      {label}
    </Link>
  );
}

function Where({ event, context }: { event: ActivityEventRow; context: ActivityContext }) {
  const channel = resolvedChannelId(event, context) ? <ChannelLink event={event} context={context} /> : null;
  const guild = resolvedGuildId(event, context) ? <GuildLink event={event} context={context} /> : null;
  if (!channel && !guild) return null;
  return (
    <span className="text-channel">
      in {channel}
      {channel && guild ? " · " : null}
      {guild}
    </span>
  );
}

export function deviceLabel(summary: Summary): string | null {
  const browser = text(summary, "browser");
  const version = text(summary, "client_version");
  const os = text(summary, "os");
  const device = text(summary, "device");
  const parts = [browser && version ? `${browser} ${version}` : browser, device ?? os].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

type Formatter = (event: ActivityEventRow, context: ActivityContext) => React.ReactNode;

const FORMATTERS: Record<string, Formatter> = {
  send_message: (event, context) => {
    const summary = event.summary;
    const words = number(summary, "word_count");
    const length = number(summary, "length");
    const attachments = number(summary, "num_attachments");
    return (
      <>
        <MessageLink event={event} context={context} label="message" />
        <span className="text-channel">
          {words !== undefined ? ` ${words} word${words === 1 ? "" : "s"}` : ""}
          {length !== undefined ? ` · ${length} chars` : ""}
          {attachments ? ` · ${attachments} attachment${attachments === 1 ? "" : "s"}` : ""}
        </span>{" "}
        <Where event={event} context={context} />
      </>
    );
  },
  add_reaction: (event, context) => (
    <>
      <span className="text-base leading-none">{text(event.summary, "emoji_name") ?? "reaction"}</span>{" "}
      <span className="text-channel">on</span>{" "}
      <MessageLink event={event} context={context} label="a message" />{" "}
      <Where event={event} context={context} />
    </>
  ),
  remove_reaction: (event, context) => (
    <>
      <span className="text-base leading-none">{text(event.summary, "emoji_name") ?? "reaction"}</span>{" "}
      <span className="text-channel">removed from</span>{" "}
      <MessageLink event={event} context={context} label="a message" />{" "}
      <Where event={event} context={context} />
    </>
  ),
  app_opened: (event) => {
    const summary = event.summary;
    const from = text(summary, "opened_from");
    const theme = text(summary, "theme");
    if (!from && !theme) {
      return <span className="text-channel">{deviceLabel(summary) ?? "unknown client"}</span>;
    }
    return (
      <span className="text-channel">
        {from ? `opened from ${from}` : ""}
        {from && theme ? " · " : ""}
        {theme ? `${theme} theme` : ""}
      </span>
    );
  },
  voice_disconnect: (event, context) => {
    const duration = number(event.summary, "duration");
    const reason = text(event.summary, "reason");
    return (
      <>
        <span className="text-normal">
          {duration !== undefined ? formatDurationMs(duration) : "unknown duration"}
        </span>
        <span className="text-channel">{reason ? ` · ${reason}` : ""}</span>{" "}
        <Where event={event} context={context} />
      </>
    );
  },
  video_stream_ended: (event, context) => {
    const duration = number(event.summary, "duration");
    const reason = text(event.summary, "reason");
    return (
      <>
        <span className="text-normal">{duration !== undefined ? `${duration}s` : "unknown duration"}</span>
        <span className="text-channel">{reason ? ` · ${reason}` : ""}</span>{" "}
        <Where event={event} context={context} />
      </>
    );
  },
  experiment_user_triggered: (event) => (
    <>
      <span className="text-normal">{text(event.summary, "name") ?? "experiment"}</span>
      <span className="text-channel"> bucket {text(event.summary, "bucket") ?? "?"}</span>
    </>
  ),
  launch_game: (event) => (
    <span className="text-normal">{text(event.summary, "game") ?? text(event.summary, "game_name") ?? "game"}</span>
  ),
  update_user_settings: (event) => (
    <span className="text-channel">{text(event.summary, "theme") ? `theme ${text(event.summary, "theme")}` : "settings changed"}</span>
  ),
};

const POPOUT_TYPES = new Set(["open_popout", "close_popout", "open_modal", "close_modal"]);
const PLACE_EVENTS = new Set([
  "channel_opened",
  "ack_messages",
  "guild_viewed",
  "start_speaking",
  "stop_speaking",
  "start_listening",
  "join_voice_channel",
  "leave_voice_channel",
  "join_call",
  "media_session_joined",
  "voice_connection_success",
  "settings_pane_viewed",
  "resolve_invite",
  "accepted_instant_invite",
  "invite_sent",
]);

const IGNORED_KEYS = new Set([
  "os",
  "browser",
  "device",
  "client_version",
  "city",
  "channel_type",
  "message_type",
]);

function defaultSummary(event: ActivityEventRow, context: ActivityContext): React.ReactNode {
  const entries = Object.entries(event.summary).filter(([key]) => !IGNORED_KEYS.has(key));
  const where = resolvedChannelId(event, context) || resolvedGuildId(event, context);
  if (entries.length === 0 && !where) return <span className="text-faint">—</span>;
  return (
    <>
      {entries.length ? (
        <span className="text-channel">
          {entries.map(([key, value]) => `${key}: ${value}`).join(" · ")}
        </span>
      ) : null}{" "}
      <Where event={event} context={context} />
    </>
  );
}

export function EventSummary({
  event,
  context,
}: {
  event: ActivityEventRow;
  context: ActivityContext;
}) {
  const formatter = FORMATTERS[event.eventType];
  if (formatter) return <>{formatter(event, context)}</>;

  if (POPOUT_TYPES.has(event.eventType)) {
    return (
      <>
        <span className="text-normal">{text(event.summary, "type") ?? "unknown"}</span>{" "}
        <Where event={event} context={context} />
      </>
    );
  }

  if (PLACE_EVENTS.has(event.eventType)) {
    const channelType = text(event.summary, "channel_type");
    const location = text(event.summary, "location");
    return (
      <>
        <Where event={event} context={context} />
        <span className="text-faint">
          {channelType ? ` · ${channelTypeName(Number(channelType))}` : ""}
          {location ? ` · ${location}` : ""}
        </span>
      </>
    );
  }

  return defaultSummary(event, context);
}

export function EventMeta({ event }: { event: ActivityEventRow }) {
  const device = deviceLabel(event.summary);
  const city = text(event.summary, "city");
  const parts = [device, city].filter(Boolean);
  return parts.length ? <>{parts.join(" · ")}</> : null;
}
