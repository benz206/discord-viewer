import Link from "next/link";
import { Server } from "lucide-react";

import { listGuilds } from "@/lib/data/servers";
import { Avatar } from "@/components/common/avatar";
import { GuildCard } from "@/components/servers/guild-card";
import { assetUrl, formatNumber } from "@/components/servers/format";
import { PageBody, PageHeader, PageShell, Section, SidebarHeader } from "@/components/servers/page-shell";

export const metadata = { title: "Servers · Discord Viewer" };

export default function ServersPage() {
  const guilds = listGuilds();
  const detailed = guilds.filter((guild) => guild.hasChannels);
  const totals = guilds.reduce(
    (sum, guild) => ({
      messages: sum.messages + guild.messageCount,
      roles: sum.roles + guild.roleCount,
      channels: sum.channels + guild.channelCount,
      emoji: sum.emoji + guild.emojiCount,
      bans: sum.bans + guild.banCount,
      webhooks: sum.webhooks + guild.webhookCount,
      auditLog: sum.auditLog + guild.auditLogCount,
    }),
    { messages: 0, roles: 0, channels: 0, emoji: 0, bans: 0, webhooks: 0, auditLog: 0 },
  );

  return (
    <PageShell
      sidebar={
        <>
          <SidebarHeader title="Servers" subtitle={`${guilds.length} in this export`} />
          <nav aria-label="Servers" className="scrollbar-discord min-h-0 flex-1 overflow-y-auto py-2">
            <ul className="space-y-0.5 px-2">
              {guilds.map((guild) => (
                <li key={guild.id}>
                  <Link
                    href={`/servers/${guild.id}`}
                    className="flex h-11 items-center gap-2 rounded px-2 text-channel transition-colors hover:bg-hover hover:text-interactive-hover"
                  >
                    <Avatar
                      src={guild.iconFile ? assetUrl(guild.iconFile) : null}
                      name={guild.name}
                      id={guild.id}
                      size={28}
                      rounded="lg"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm leading-4">{guild.name}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {formatNumber(guild.messageCount)} messages
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      }
    >
      <PageHeader
        icon={<Server />}
        title="Servers"
        subtitle={`${guilds.length} guilds · ${detailed.length} with a full settings export`}
      />
      <PageBody>
        <Section title="Package totals">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Guilds", guilds.length],
              ["Messages", totals.messages],
              ["Roles", totals.roles],
              ["Channels", totals.channels],
              ["Emoji", totals.emoji],
              ["Bans", totals.bans],
              ["Webhooks", totals.webhooks],
              ["Audit entries", totals.auditLog],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-[11px] tracking-wide text-channel uppercase">{label}</dt>
                <dd className="text-lg font-semibold text-header">{formatNumber(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title={`All servers (${guilds.length})`} description="Sorted by exported message count.">
          <div className="grid grid-cols-1 gap-3">
            {guilds.map((guild) => (
              <GuildCard key={guild.id} guild={guild} />
            ))}
          </div>
        </Section>
      </PageBody>
    </PageShell>
  );
}
