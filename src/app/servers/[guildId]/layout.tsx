import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { Avatar } from "@/components/common/avatar";
import { assetUrl, formatNumber } from "@/components/servers/format";
import { guildPeople } from "@/components/servers/people";
import { PageShell } from "@/components/servers/page-shell";
import { SettingsNav } from "@/components/servers/settings-nav";

export default async function GuildSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const base = `/servers/${guild.id}`;
  const people = guildPeople(guild);

  return (
    <PageShell
      sidebar={
        <>
          <div className="flex shrink-0 flex-col gap-2 px-3 pt-3 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
            <Link
              href="/servers"
              className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-channel uppercase hover:text-interactive-hover"
            >
              <ChevronLeft className="size-3.5" /> All servers
            </Link>
            <div className="flex items-center gap-2">
              <Avatar
                src={guild.iconFile ? assetUrl(guild.iconFile) : null}
                name={guild.name}
                id={guild.id}
                size={32}
                rounded="lg"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-header">{guild.name}</div>
                <div className="truncate font-mono text-[10px] text-faint">{guild.id}</div>
              </div>
            </div>
          </div>

          <SettingsNav
            groups={[
              {
                id: "server",
                label: guild.name,
                items: [
                  { href: `${base}/overview`, label: "Overview", missing: !guild.hasGuildJson },
                  { href: `${base}/roles`, label: "Roles", count: guild.roleCount, missing: guild.roleCount === 0 },
                  {
                    href: `${base}/channels`,
                    label: "Channels",
                    count: guild.channelCount,
                    missing: !guild.hasChannels,
                  },
                  { href: `${base}/emoji`, label: "Emoji", count: guild.emojiCount, missing: !guild.hasEmoji },
                  {
                    href: `${base}/webhooks`,
                    label: "Webhooks",
                    count: guild.webhookCount,
                    missing: !guild.hasWebhooks,
                  },
                ],
              },
              {
                id: "moderation",
                label: "Moderation",
                items: [
                  { href: `${base}/bans`, label: "Bans", count: guild.banCount, missing: !guild.hasBans },
                  {
                    href: `${base}/audit-log`,
                    label: "Audit Log",
                    count: guild.auditLogCount,
                    missing: !guild.hasAuditLog,
                  },
                ],
              },
              {
                id: "people",
                label: "User Management",
                items: [
                  { href: `${base}/members`, label: "People seen", count: people.length, missing: people.length === 0 },
                ],
              },
              {
                id: "export",
                label: "Export",
                items: [{ href: `${base}/raw`, label: "Raw files" }],
              },
            ]}
          />

          <div className="shrink-0 bg-surface-alt px-3 py-2">
            {guild.messageCount > 0 ? (
              <Link
                href={`/channels/${guild.id}`}
                className="flex items-center gap-2 rounded px-1 py-1 text-sm text-channel hover:bg-hover hover:text-interactive-hover"
              >
                <MessageSquare className="size-4" />
                <span className="truncate">{formatNumber(guild.messageCount)} messages</span>
              </Link>
            ) : (
              <span className="block px-1 py-1 text-sm text-faint">No exported messages</span>
            )}
          </div>
        </>
      }
    >
      {children}
    </PageShell>
  );
}
