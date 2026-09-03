import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import type { GuildRole } from "@/lib/data/types";
import { formatDateTime, roleColor, snowflakeDate } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { PermissionBreakdown } from "@/components/servers/permission-breakdown";
import { RawDetails } from "@/components/servers/raw-details";

const DEFAULT_ROLE_COLOR = "#99aab5";

function RoleCard({ role }: { role: GuildRole }) {
  const color = roleColor(role.color);
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color ?? DEFAULT_ROLE_COLOR }}
        />
        <span className="text-base font-semibold" style={{ color: color ?? undefined }}>
          {role.name}
        </span>
        {role.hoist ? <Pill tone="brand">Hoisted</Pill> : null}
        {role.mentionable ? <Pill tone="brand">Mentionable</Pill> : null}
        {role.managed ? <Pill tone="warning">Managed by integration</Pill> : null}
        {role.unicode_emoji ? <Pill>{role.unicode_emoji}</Pill> : null}
        {role.icon ? <Pill>icon {role.icon}</Pill> : null}
        <span className="ml-auto shrink-0 text-xs text-channel">position {role.position}</span>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-faint">
        <span>id {role.id}</span>
        <span>color {color ?? "none"} ({role.color})</span>
        <span>flags {role.flags}</span>
        <span>created {formatDateTime(snowflakeDate(role.id))}</span>
      </div>

      <div className="mt-3 border-t border-divider pt-3">
        <PermissionBreakdown value={role.permissions} />
      </div>
    </div>
  );
}

export default async function GuildRolesPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const roles = Object.values(guild.guild?.roles ?? {}).sort((a, b) => b.position - a.position);

  return (
    <>
      <PageHeader icon={<ShieldCheck />} title="Roles" subtitle={`${guild.name} · ${roles.length} roles`} />
      {roles.length === 0 ? (
        <MissingFile file="guild.json roles" what="role" />
      ) : (
        <PageBody>
          <Section
            title={`Roles (${roles.length})`}
            description="Highest position first, the same order Discord uses in Server Settings."
          >
            <div className="space-y-3">
              {roles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
            <RawDetails value={guild.guild?.roles} name="roles" />
          </Section>
        </PageBody>
      )}
    </>
  );
}
