"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileJson, Info, MessageSquareOff, Waypoints } from "lucide-react";

import type { ResolverMap } from "@/lib/resolvers-client";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { ChannelHeader } from "@/components/layout/channel-header";
import { ChannelIcon, type ChannelKind } from "@/components/layout/channel-icon";
import type { MessageAuthor } from "@/components/messages/message-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageStream, type StreamMessage } from "@/components/app/message-stream";
import { Sparkline, type SparkPoint } from "@/components/app/sparkline";
import { formatCount, formatDateTime } from "@/components/app/format";

export type ChannelRecipient = {
  id: string;
  name: string | null;
  discriminator: string | null;
  avatar: string | null;
  sources: string[];
};

export type ChannelViewProps = {
  channelId: string;
  name: string;
  kind: ChannelKind;
  topic: string | null;
  typeName: string;
  guildName: string | null;
  guildId: string | null;
  guildHref: string | null;
  messageCount: number;
  firstTs: number | null;
  lastTs: number | null;
  activeDays: number;
  spark: SparkPoint[];
  channelJson: unknown;
  recipients: ChannelRecipient[];
  csvPath: string | null;
  csvSize: number | null;
  jsonPath: string | null;
  author: MessageAuthor;
  initialMessages: StreamMessage[];
  initialResolvers: ResolverMap;
  initialHasOlder: boolean;
  initialHasNewer: boolean;
  highlightId: string | null;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-channel uppercase">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm text-normal">{value}</span>
    </div>
  );
}

function bytes(size: number | null) {
  if (size === null) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function InfoPanel(props: ChannelViewProps) {
  return (
    <Tabs defaultValue="info" className="flex h-full min-h-0 flex-col gap-0">
      <TabsList variant="line" className="h-12 shrink-0 gap-2 px-3">
        <TabsTrigger value="info">Channel Info</TabsTrigger>
        <TabsTrigger value="raw">Raw</TabsTrigger>
      </TabsList>

      <TabsContent
        value="info"
        className="scrollbar-discord min-h-0 flex-1 overflow-y-auto px-3 pb-6"
      >
        <div className="divide-y divide-divider">
          <Field label="ID" value={<span className="font-mono text-xs">{props.channelId}</span>} />
          <Field label="Type" value={props.typeName} />
          {props.guildName ? (
            <Field
              label="Server"
              value={
                props.guildHref ? (
                  <Link href={props.guildHref} className="text-link hover:underline">
                    {props.guildName}
                  </Link>
                ) : (
                  props.guildName
                )
              }
            />
          ) : null}
          <Field label="Messages" value={formatCount(props.messageCount)} />
          <Field label="First" value={formatDateTime(props.firstTs)} />
          <Field label="Last" value={formatDateTime(props.lastTs)} />
          <Field label="Active days" value={formatCount(props.activeDays)} />
        </div>

        {props.spark.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1 text-[11px] font-semibold tracking-wide text-channel uppercase">
              Messages per period
            </div>
            <Sparkline points={props.spark} height={44} />
          </div>
        ) : null}

        {props.recipients.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1 text-[11px] font-semibold tracking-wide text-channel uppercase">
              Recipients — {props.recipients.length}
            </div>
            <ul className="space-y-0.5">
              {props.recipients.map((recipient) => (
                <li key={recipient.id}>
                  <Link
                    href={`/users/${recipient.id}`}
                    className="flex items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-hover"
                  >
                    <Avatar
                      size={28}
                      id={recipient.id}
                      name={recipient.name}
                      src={
                        recipient.avatar
                          ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.${recipient.avatar.startsWith("a_") ? "gif" : "png"}?size=64`
                          : null
                      }
                      ringColor="var(--color-surface-2)"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-normal">
                        {recipient.name ?? "Unknown user"}
                        {recipient.discriminator ? (
                          <span className="text-faint">#{recipient.discriminator}</span>
                        ) : null}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-faint">
                        {recipient.id}
                      </span>
                      {recipient.sources.length > 0 ? (
                        <span className="block truncate text-[10px] text-faint">
                          {recipient.sources.join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-1.5">
          <Link
            href={`/activity?channelId=${props.channelId}`}
            className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-2 text-sm text-link transition-colors hover:bg-hover"
          >
            <Waypoints className="size-4" />
            Activity events for this channel
          </Link>
          {props.guildId ? (
            <Link
              href={`/activity?guildId=${props.guildId}`}
              className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-2 text-sm text-link transition-colors hover:bg-hover"
            >
              <Waypoints className="size-4" />
              Activity events for this server
            </Link>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent
        value="raw"
        className="scrollbar-discord min-h-0 flex-1 overflow-y-auto px-3 pb-6"
      >
        <div className="mb-3 flex flex-col gap-1.5">
          {props.jsonPath ? (
            <a
              href={`/api/asset/${props.jsonPath}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-2 text-sm text-link transition-colors hover:bg-hover"
            >
              <FileJson className="size-4" />
              channel.json
            </a>
          ) : null}
          {props.csvPath ? (
            <a
              href={`/api/asset/${props.csvPath}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-surface-3 px-3 py-2 text-sm text-link transition-colors hover:bg-hover"
            >
              <Download className="size-4" />
              messages.csv
              <span className="ml-auto text-xs text-faint">{bytes(props.csvSize)}</span>
            </a>
          ) : null}
        </div>
        {props.channelJson ? (
          <JsonViewer value={props.channelJson} defaultExpandedDepth={2} />
        ) : (
          <p className="text-sm text-channel">No channel.json in the export.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ChannelView(props: ChannelViewProps) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface">
      <ChannelHeader
        name={props.name}
        kind={props.kind}
        topic={props.topic ?? undefined}
        actions={[
          {
            id: "info",
            label: "Channel Info",
            icon: <Info />,
            active: panelOpen,
            onClick: () => setPanelOpen((open) => !open),
          },
        ]}
        search={{
          placeholder: "Search channel",
          onSubmit: (value) => {
            const query = value.trim();
            if (!query) return;
            router.push(
              `/search?q=${encodeURIComponent(query)}&channelId=${props.channelId}`,
            );
          },
        }}
      />

      <div className="flex min-h-0 flex-1">
        <MessageStream
          channelId={props.channelId}
          author={props.author}
          initialMessages={props.initialMessages}
          initialResolvers={props.initialResolvers}
          initialHasOlder={props.initialHasOlder}
          initialHasNewer={props.initialHasNewer}
          highlightId={props.highlightId}
          empty={
            <EmptyState
              icon={<MessageSquareOff />}
              title="No messages here"
              description="This channel is in the export but messages.csv has no rows you sent."
            />
          }
          intro={
            props.messageCount > 0 ? (
              <div className="px-4 pt-8 pb-2">
                <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-surface-2">
                  <ChannelIcon kind={props.kind} className="size-9 text-header" />
                </span>
                <h2 className="text-3xl leading-9 font-bold text-header">
                  {props.kind === "dm" || props.kind === "group" ? "" : "#"}
                  {props.name}
                </h2>
                <p className="mt-1 text-base text-channel">
                  This is the beginning of the archive — {formatCount(props.messageCount)}{" "}
                  {props.messageCount === 1 ? "message" : "messages"} you sent here.
                </p>
              </div>
            ) : null
          }
        />

        {panelOpen ? (
          <aside className="flex w-80 shrink-0 flex-col border-l border-divider bg-surface-2">
            <InfoPanel {...props} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
