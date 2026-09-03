import Link from "next/link";

import type { GuildRow } from "@/lib/data/types";
import { Avatar } from "@/components/common/avatar";
import { UserRef } from "@/components/users/user-ref";
import { assetUrl, formatNumber } from "@/components/servers/format";
import { Pill } from "@/components/servers/page-shell";

function FileBadge({ present, label, count }: { present: boolean; label: string; count?: number }) {
  if (!present) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-4 text-faint line-through">
        {label}
      </span>
    );
  }
  return (
    <Pill tone="positive">
      {label}
      {count === undefined ? null : <span className="text-positive/70">{formatNumber(count)}</span>}
    </Pill>
  );
}

export function GuildCard({ guild }: { guild: GuildRow }) {
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <div className="flex items-start gap-3">
        <Avatar
          src={guild.iconFile ? assetUrl(guild.iconFile) : null}
          name={guild.name}
          id={guild.id}
          size={48}
          rounded="lg"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/servers/${guild.id}`} className="block truncate text-base font-semibold text-header hover:underline">
            {guild.name}
          </Link>
          <div className="mt-0.5 font-mono text-[11px] text-faint">{guild.id}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-channel">
            <span className="shrink-0">Owner</span>
            {guild.ownerId ? <UserRef id={guild.ownerId} size={16} /> : <span className="text-faint">unknown</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg leading-6 font-semibold text-header">{formatNumber(guild.messageCount)}</div>
          <div className="text-[11px] text-channel">
            messages in {formatNumber(guild.messageChannelCount)} channels
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <FileBadge present={guild.hasGuildJson} label="guild.json" />
        <FileBadge present={guild.roleCount > 0} label="roles" count={guild.roleCount} />
        <FileBadge present={guild.hasChannels} label="channels.json" count={guild.channelCount} />
        <FileBadge present={guild.hasAuditLog} label="audit-log.json" count={guild.auditLogCount} />
        <FileBadge present={guild.hasBans} label="bans.json" count={guild.banCount} />
        <FileBadge present={guild.hasEmoji} label="emoji.json" count={guild.emojiCount} />
        <FileBadge present={guild.hasWebhooks} label="webhooks.json" count={guild.webhookCount} />
        <FileBadge present={Boolean(guild.iconFile)} label="icon" />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <Link href={`/servers/${guild.id}`} className="text-link hover:underline">
          Server settings
        </Link>
        {guild.messageCount > 0 ? (
          <Link href={`/channels/${guild.id}`} className="text-link hover:underline">
            Open messages
          </Link>
        ) : (
          <span className="text-faint">No exported messages</span>
        )}
      </div>
    </div>
  );
}
