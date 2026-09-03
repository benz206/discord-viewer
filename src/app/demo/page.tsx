"use client";

import { useState } from "react";
import { Bell, Braces, CircleHelp, Inbox, Pin, Search } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ChannelHeader } from "@/components/layout/channel-header";
import { ChannelSidebar } from "@/components/layout/channel-sidebar";
import { GuildRail } from "@/components/layout/guild-rail";
import { MemberPanel } from "@/components/layout/member-panel";
import { MessageList } from "@/components/messages/message-list";
import type { ChatMessage } from "@/components/messages/message-row";
import type { MarkdownResolvers } from "@/components/messages/message-content";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Kbd } from "@/components/common/kbd";
import { UserTag } from "@/components/common/user-tag";

const OWNER = "360061101477724170";
const FRIEND = "222222222222222222";
const BOT = "333333333333333333";

const USERS: Record<string, { name: string; color?: string }> = {
  [OWNER]: { name: "benz", color: "#f0b232" },
  [FRIEND]: { name: "quiet.pixel" },
  [BOT]: { name: "Archivist", color: "#23a55a" },
};

const CHANNELS: Record<string, { name: string }> = {
  "111111111111111111": { name: "general" },
  "222222222222222222": { name: "screenshots" },
};

const ROLES: Record<string, { name: string; color: string }> = {
  "987654321098765432": { name: "Moderator", color: "#eb459e" },
};

const resolvers: MarkdownResolvers = {
  resolveUser: (id) => USERS[id],
  resolveChannel: (id) => CHANNELS[id],
  resolveRole: (id) => ROLES[id],
};

const KITCHEN_SINK = [
  "# Heading one",
  "## Heading two",
  "### Heading three",
  "-# subtext sits under the headings",
  "",
  "**bold** *italic* __underline__ ~~strikethrough~~ `inline code` and ||a spoiler you must click||",
  "",
  "- bullet one",
  "- bullet two",
  "  - nested bullet",
  "  - another nested bullet",
  "- bullet three",
  "",
  "1. first ordered",
  "2. second ordered",
  "   1. nested ordered",
  "",
  "> a block quote",
  "> spanning two lines",
  "",
  "```ts",
  "const answer: number = 42;",
  "console.log(`the answer is ${answer}`);",
  "```",
  "",
  `Mentions: <@${OWNER}> <@&987654321098765432> <#111111111111111111> @everyone @here`,
  "",
  "Emoji: <:blobwave:123456789012345678> <a:partyparrot:123456789012345679> plus unicode 🎉",
  "",
  "Timestamps: <t:1664841600:F> · <t:1664841600:R> · <t:1664841600:t>",
  "",
  "Links: https://discord.com and [a masked link](https://discord.com/developers)",
  "",
  "Slash command: </settings show:123456789012345678>",
  "",
  "Emoticon: ¯\\_(ツ)_/¯",
].join("\n");

const MESSAGES: ChatMessage[] = [
  {
    id: "1",
    author: { id: OWNER, name: "benz", color: "#f0b232" },
    timestamp: "2022-10-05T14:02:00.000Z",
    content: "Kicking off the archive. Everything below is hard-coded sample data.",
  },
  {
    id: "2",
    author: { id: OWNER, name: "benz", color: "#f0b232" },
    timestamp: "2022-10-05T14:03:10.000Z",
    content: "This message is grouped — same author, one minute later.",
  },
  {
    id: "3",
    author: { id: OWNER, name: "benz", color: "#f0b232" },
    timestamp: "2022-10-05T14:05:44.000Z",
    content: "And a third grouped one, still inside the seven minute window.",
    editedTimestamp: "2022-10-05T14:06:02.000Z",
  },
  {
    id: "4",
    author: { id: OWNER, name: "benz", color: "#f0b232" },
    timestamp: "2022-10-05T14:40:00.000Z",
    content: "Thirty-five minutes later, so this one gets its own header.",
    attachments: [
      {
        url: "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='480'%20height='270'%3E%3Crect%20width='480'%20height='270'%20fill='%235865f2'/%3E%3Ccircle%20cx='120'%20cy='90'%20r='48'%20fill='%23faa81a'/%3E%3Ctext%20x='240'%20y='210'%20font-family='sans-serif'%20font-size='26'%20fill='white'%20text-anchor='middle'%3Eworking%20image%20preview%3C/text%3E%3C/svg%3E",
        filename: "sample-image.svg",
        contentType: "image/svg+xml",
        width: 480,
        height: 270,
      },
      "https://cdn.discordapp.com/attachments/1/2/dead-image.png",
      "https://cdn.discordapp.com/attachments/1/2/clip.mp4",
      "https://cdn.discordapp.com/attachments/1/2/voice-message.ogg",
      {
        url: "https://cdn.discordapp.com/attachments/1/2/package-export.zip",
        filename: "package-export.zip",
        size: 3_051_235_328,
      },
    ],
  },
  {
    id: "5",
    author: { id: BOT, name: "Archivist", color: "#23a55a", bot: true },
    timestamp: "2022-10-05T14:44:00.000Z",
    content: KITCHEN_SINK,
    reactions: [
      { name: "🎉", count: 4 },
      { name: "blobwave", id: "123456789012345678", count: 2, me: true },
    ],
  },
  {
    id: "6",
    author: { id: FRIEND, name: "quiet.pixel" },
    timestamp: "2022-10-06T09:15:00.000Z",
    content: "🎉🎉🎉",
    reply: {
      id: "5",
      author: { id: BOT, name: "Archivist", color: "#23a55a" },
      content: "**bold** reply preview with a <#111111111111111111> mention",
    },
  },
  {
    id: "7",
    author: { id: FRIEND, name: "quiet.pixel" },
    timestamp: "2022-10-06T09:16:00.000Z",
    content: "Pinned message with a spoiler: ||the butler did it||",
    pinned: true,
  },
];

const SAMPLE_GUILD = {
  id: "41771983423143937",
  name: "Sample Guild",
  icon_hash: "a_1269e74af4df7417b13759eae50c83dc",
  owner_id: OWNER,
  verification_level: 1,
  features: ["ANIMATED_ICON", "COMMUNITY", "NEWS", "WELCOME_SCREEN_ENABLED"],
  roles: {
    "987654321098765432": {
      id: "987654321098765432",
      name: "Moderator",
      permissions: "1071698529857",
      position: 4,
      color: 15418782,
      hoist: true,
      managed: false,
      mentionable: true,
    },
    "987654321098765433": {
      id: "987654321098765433",
      name: "@everyone",
      permissions: "104324673",
      position: 0,
      color: 0,
      hoist: false,
    },
  },
  channels: Array.from({ length: 120 }, (_, index) => ({
    id: String(900000000000000000 + index),
    name: `channel-${index}`,
    type: index % 5 === 0 ? 2 : 0,
    position: index,
  })),
  description: null,
  premium_tier: 2,
  nsfw: false,
};

const GUILDS = [
  { id: "g1", name: "Late Night Coding", href: "/demo", active: true },
  { id: "g2", name: "Synthwave Club", href: "/demo", unread: true, badge: 3 },
  { id: "g3", name: "Pixel Art", href: "/demo" },
  { id: "g4", name: "Homelab", href: "/demo", separatorAfter: true },
  { id: "g5", name: "Archived Server", href: "/demo" },
];

export default function DemoPage() {
  const [pane, setPane] = useState<"chat" | "kit">("chat");
  const [showMembers, setShowMembers] = useState(true);
  const [query, setQuery] = useState("");

  return (
    <AppShell
      rail={
        <GuildRail
          items={GUILDS}
          home={{ href: "/demo", label: "Direct Messages" }}
        />
      }
      sidebar={
        <ChannelSidebar
          title="Late Night Coding"
          subtitle="30 members"
          channels={[
            {
              id: "c0",
              name: "quiet.pixel",
              href: "/demo",
              kind: "dm",
            },
          ]}
          categories={[
            {
              id: "cat1",
              name: "Text Channels",
              channels: [
                {
                  id: "c1",
                  name: "general",
                  href: "/demo",
                  kind: "text",
                  active: true,
                },
                {
                  id: "c2",
                  name: "screenshots",
                  href: "/demo",
                  kind: "text",
                  unread: true,
                  badge: 12,
                },
                {
                  id: "c3",
                  name: "announcements",
                  href: "/demo",
                  kind: "announcement",
                },
                {
                  id: "c4",
                  name: "help-forum",
                  href: "/demo",
                  kind: "forum",
                },
                {
                  id: "c5",
                  name: "thread-about-css",
                  href: "/demo",
                  kind: "thread",
                  muted: true,
                },
              ],
            },
            {
              id: "cat2",
              name: "Voice Channels",
              defaultOpen: false,
              channels: [
                { id: "c6", name: "Lounge", href: "/demo", kind: "voice" },
                { id: "c7", name: "Stage", href: "/demo", kind: "stage" },
              ],
            },
          ]}
          footer={
            <UserTag
              name="benz"
              id={OWNER}
              color="#f0b232"
              subtitle="#0001"
              size="sm"
            />
          }
        />
      }
      header={
        <ChannelHeader
          name="general"
          kind="text"
          topic="Everything on this page is hard-coded sample data for eyeballing the UI."
          actions={[
            { id: "pins", label: "Pinned Messages", icon: <Pin /> },
            { id: "notif", label: "Notification Settings", icon: <Bell /> },
            { id: "inbox", label: "Inbox", icon: <Inbox /> },
            {
              id: "raw",
              label: "Raw data",
              icon: <Braces />,
              active: pane === "kit",
              onClick: () => setPane(pane === "kit" ? "chat" : "kit"),
            },
            { id: "help", label: "Help", icon: <CircleHelp /> },
          ]}
          search={{ value: query, onChange: setQuery }}
          onToggleMembers={() => setShowMembers((value) => !value)}
          membersActive={showMembers}
        />
      }
      panel={
        showMembers ? (
          <MemberPanel
            title="Members"
            groups={[
              {
                id: "mods",
                name: "Moderator",
                members: [
                  {
                    id: OWNER,
                    name: "benz",
                    color: "#f0b232",
                    status: "online",
                  },
                  {
                    id: BOT,
                    name: "Archivist",
                    color: "#23a55a",
                    status: "dnd",
                    bot: true,
                  },
                ],
              },
              {
                id: "online",
                name: "Online",
                members: [
                  {
                    id: FRIEND,
                    name: "quiet.pixel",
                    status: "idle",
                    subtitle: "playing Factorio",
                  },
                  { id: "444", name: "nullpointer", status: "online" },
                  { id: "555", name: "kilo", status: "offline" },
                ],
              },
            ]}
          />
        ) : undefined
      }
    >
      {pane === "chat" ? (
        <MessageList
          messages={MESSAGES}
          resolvers={resolvers}
          header={
            <div className="px-4 pt-16 pb-2">
              <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-elevated text-3xl">
                #
              </div>
              <h2 className="text-3xl font-bold text-header">
                Welcome to #general
              </h2>
              <p className="text-base text-channel">
                This is the start of the #general channel.
              </p>
            </div>
          }
          empty={
            <EmptyState
              icon={<Search />}
              title="No messages"
              description="Nothing was exported for this channel."
            />
          }
        />
      ) : (
        <div className="scrollbar-discord min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-header uppercase">
              JsonViewer
            </h2>
            <JsonViewer
              value={SAMPLE_GUILD}
              name="guild"
              defaultExpandedDepth={2}
              chunkSize={25}
              className="max-h-[420px]"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-header uppercase">
              Avatar
            </h2>
            <div className="flex items-center gap-4">
              <Avatar name="benz" id={OWNER} size={24} />
              <Avatar name="quiet.pixel" id={FRIEND} size={32} status="idle" />
              <Avatar name="Archivist" id={BOT} size={40} status="dnd" />
              <Avatar
                src="https://cdn.discordapp.com/avatars/1/dead.png"
                name="Broken Image"
                id="777"
                size={48}
                status="online"
              />
              <Avatar src="/globe.svg" name="Globe" size={48} rounded="lg" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-header uppercase">
              UserTag
            </h2>
            <div className="flex flex-col gap-2">
              <UserTag name="benz" id={OWNER} color="#f0b232" subtitle="#0001" />
              <UserTag name="Archivist" id={BOT} bot />
              <UserTag name="quiet.pixel" id={FRIEND} size="sm" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-header uppercase">
              Kbd
            </h2>
            <p className="text-sm text-channel">
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search, <Kbd>Esc</Kbd> to close.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-header uppercase">
              EmptyState
            </h2>
            <EmptyState
              icon={<Inbox />}
              title="Nothing here yet"
              description="Pick a channel on the left to start browsing the archive."
              action={<Kbd>⌘K</Kbd>}
              className="rounded-lg border border-divider"
            />
          </section>
        </div>
      )}
    </AppShell>
  );
}
