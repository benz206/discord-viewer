import Link from "next/link";
import { ExternalLink, Filter, Hash, MessageSquare, Server } from "lucide-react";

import { JsonViewer } from "@/components/common/json-viewer";
import { channelTypeName, type ActivityEventRow } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { domainColor } from "@/components/activity/domains";
import { formatTimestamp } from "@/components/activity/format";
import { activityHref } from "@/components/activity/query";
import {
  channelHref,
  effectiveIds,
  guildHref,
  serverHref,
  type ActivityContext,
} from "@/components/activity/context";

export type ActivityEventDetail = {
  event: ActivityEventRow;
  raw: Record<string, unknown>;
  context: ActivityContext;
};

const pillClass =
  "flex items-center gap-1.5 rounded bg-surface-3 px-2 py-1 text-[13px] text-channel transition-colors hover:text-interactive-hover [&_svg]:size-3.5";

function LinkRow({
  icon,
  label,
  value,
  links,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  links: Array<{ href: string; text: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase [&_svg]:size-3.5">
        {icon}
        {label}
      </span>
      <span className="font-mono text-[13px] text-normal">{value}</span>
      {links.map((link) => (
        <Link key={link.href + link.text} href={link.href} className={pillClass}>
          {link.text}
        </Link>
      ))}
    </div>
  );
}

export function EventDetail({ event, raw, context, compact }: ActivityEventDetail & { compact?: boolean }) {
  const ids = effectiveIds(event, raw);
  const channel = ids.channelId ? context.channels[ids.channelId] : undefined;
  const message = ids.messageId ? context.messages[ids.messageId] : undefined;
  const messageChannel = message ? context.channels[message.channelId] : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: domainColor(event.domain) }}
            aria-hidden
          />
          <h2 className="font-mono text-base font-semibold text-header">{event.eventType}</h2>
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-channel">{event.domain}</span>
        </div>
        <div className="text-[13px] text-channel tabular-nums">
          {formatTimestamp(event.ts)} UTC · row #{event.id}
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-divider bg-surface-2 p-3">
        {ids.guildId ? (
          <LinkRow
            icon={<Server />}
            label="Guild"
            value={context.guilds[ids.guildId] ?? ids.guildId}
            links={[
              { href: guildHref(ids.guildId), text: "Channels" },
              { href: serverHref(ids.guildId), text: "Server" },
              { href: activityHref({ guildId: ids.guildId }), text: "Filter activity" },
            ]}
          />
        ) : null}

        {ids.channelId ? (
          <LinkRow
            icon={<Hash />}
            label="Channel"
            value={channel ? channel.name : ids.channelId}
            links={[
              { href: channelHref(ids.channelId, channel?.guildId ?? ids.guildId), text: "Open" },
              { href: activityHref({ channelId: ids.channelId }), text: "Filter activity" },
            ]}
          />
        ) : null}

        {ids.messageId ? (
          <LinkRow
            icon={<MessageSquare />}
            label="Message"
            value={ids.messageId}
            links={[
              ...(message
                ? [
                    {
                      href: `${channelHref(message.channelId, messageChannel?.guildId ?? null)}?message=${ids.messageId}`,
                      text: messageChannel ? `Jump to ${messageChannel.name}` : "Jump to message",
                    },
                  ]
                : []),
              { href: activityHref({ messageId: ids.messageId }), text: "Filter activity" },
            ]}
          />
        ) : null}

        {!ids.guildId && !ids.channelId && !ids.messageId ? (
          <div className="text-[13px] text-faint">No guild, channel or message attached to this event.</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase [&_svg]:size-3.5">
            <Filter />
            Same type
          </span>
          <Link
            href={activityHref({ domain: event.domain, eventType: event.eventType })}
            className={pillClass}
          >
            All {event.eventType}
          </Link>
          {event.day ? (
            <Link href={activityHref({ from: event.day, to: event.day })} className={pillClass}>
              Everything on {event.day}
            </Link>
          ) : null}
        </div>
      </div>

      {Object.keys(event.summary).length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(event.summary).map(([key, value]) => (
            <span
              key={key}
              className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-channel"
              title={key === "channel_type" ? channelTypeName(Number(value)) : undefined}
            >
              <span className="text-faint">{key}</span> {String(value)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-wide text-faint uppercase">Raw event</h3>
          <Link
            href={`/activity/${event.id}`}
            className="flex items-center gap-1 text-[11px] text-link hover:underline [&_svg]:size-3"
          >
            <ExternalLink />
            Permalink
          </Link>
        </div>
        <JsonViewer
          value={raw}
          name="event"
          expandAll
          chunkSize={100}
          className={cn(compact ? "max-h-[60vh]" : "max-h-[70vh]")}
        />
      </div>
    </div>
  );
}
