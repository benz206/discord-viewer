import { notFound } from "next/navigation";
import { Webhook } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { ChannelRef } from "@/components/servers/channel-ref";
import { WEBHOOK_TYPES } from "@/components/servers/constants";
import { DefinitionList, ScalarValue } from "@/components/servers/definition-list";
import { assetUrl, formatDateTime, snowflakeDate } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import { UserRef } from "@/components/users/user-ref";

export default async function GuildWebhooksPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const webhooks = guild.webhooks;
  if (!webhooks) {
    return (
      <>
        <PageHeader icon={<Webhook />} title="Webhooks" subtitle={guild.name} />
        <MissingFile file="webhooks.json" what="webhook" />
      </>
    );
  }

  const avatars = new Set(guild.assets.webhookAvatars.map((asset) => asset.hash));

  return (
    <>
      <PageHeader icon={<Webhook />} title="Webhooks" subtitle={`${guild.name} · ${webhooks.length} webhooks`} />
      {webhooks.length === 0 ? (
        <EmptyState
          icon={<Webhook />}
          title="No webhooks"
          description="webhooks.json exists for this server but is empty."
        />
      ) : (
        <PageBody>
          <Section title={`Webhooks (${webhooks.length})`}>
            <div className="space-y-3">
              {webhooks.map((hook) => {
                const record = hook as unknown as Record<string, unknown>;
                const avatarPath =
                  hook.avatar && avatars.has(hook.avatar)
                    ? `servers/${guild.id}/webhooks/${hook.avatar}.png`
                    : null;
                return (
                  <div key={hook.id} className="rounded-lg bg-surface-2 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={avatarPath ? assetUrl(avatarPath) : null}
                        name={hook.name}
                        id={hook.id}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-semibold text-header">{hook.name}</span>
                          <Pill tone="brand">{WEBHOOK_TYPES[hook.type] ?? `Type ${hook.type}`}</Pill>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-faint">
                          {hook.id} · created {formatDateTime(snowflakeDate(hook.id))}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-channel">
                          <span>Posts to</span>
                          <ChannelRef guildId={guild.id} id={hook.channel_id} />
                          <span className="font-mono text-[11px] text-faint">{hook.channel_id}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-channel">
                          <span>Application</span>
                          {hook.application_id ? (
                            <>
                              <UserRef id={hook.application_id} size={16} />
                              <span className="font-mono text-[11px] text-faint">{hook.application_id}</span>
                            </>
                          ) : (
                            <span className="text-faint">none</span>
                          )}
                        </div>
                        {hook.source_guild || hook.source_channel ? (
                          <div className="mt-1 text-sm text-channel">
                            Follows{" "}
                            <span className="text-header">{hook.source_channel?.name ?? "?"}</span> in{" "}
                            <span className="text-header">{hook.source_guild?.name ?? "?"}</span>
                          </div>
                        ) : null}
                        {avatarPath ? (
                          <a href={assetUrl(avatarPath)} download className="mt-1.5 inline-block text-[11px] text-link hover:underline">
                            Download avatar
                          </a>
                        ) : hook.avatar ? (
                          <div className="mt-1.5 text-[11px] text-faint">avatar {hook.avatar} not exported</div>
                        ) : null}
                      </div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
                        All {Object.keys(record).length} fields
                      </summary>
                      <DefinitionList
                        className="mt-2 bg-surface-3/60"
                        fields={Object.keys(record).map((key) => ({
                          key,
                          label: key,
                          value: <ScalarValue value={record[key]} />,
                        }))}
                      />
                    </details>
                  </div>
                );
              })}
            </div>
            <RawDetails value={webhooks} name="webhooks.json" />
          </Section>
        </PageBody>
      )}
    </>
  );
}
