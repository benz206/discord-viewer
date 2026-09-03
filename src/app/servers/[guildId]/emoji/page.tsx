import { notFound } from "next/navigation";
import { Smile } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { EmptyState } from "@/components/common/empty-state";
import { DefinitionList, ScalarValue } from "@/components/servers/definition-list";
import { assetUrl, formatDateTime, roleColor, snowflakeDate } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import { UserRef } from "@/components/users/user-ref";

export default async function GuildEmojiPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const emoji = guild.emoji;
  if (!emoji) {
    return (
      <>
        <PageHeader icon={<Smile />} title="Emoji" subtitle={guild.name} />
        <MissingFile file="emoji.json" what="emoji" />
      </>
    );
  }

  const files = new Map(guild.assets.emoji.map((asset) => [asset.id, asset.path]));
  const roles = guild.guild?.roles ?? {};
  const animatedCount = emoji.filter((item) => item.animated).length;

  return (
    <>
      <PageHeader
        icon={<Smile />}
        title="Emoji"
        subtitle={`${guild.name} · ${emoji.length} emoji · ${animatedCount} animated`}
      />
      {emoji.length === 0 ? (
        <EmptyState
          icon={<Smile />}
          title="No emoji"
          description="emoji.json exists for this server but is empty."
        />
      ) : (
        <PageBody>
          <Section title={`Emoji (${emoji.length})`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {emoji.map((item) => {
                const path = files.get(item.id) ?? `servers/${guild.id}/emoji/${item.id}.${item.animated ? "gif" : "png"}`;
                const record = item as unknown as Record<string, unknown>;
                return (
                  <div key={item.id} className="rounded-lg bg-surface-2 p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={assetUrl(path)}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded bg-surface-3 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-header">:{item.name}:</span>
                          {item.animated ? <Pill tone="brand">Animated</Pill> : null}
                          {item.managed ? <Pill tone="warning">Managed</Pill> : null}
                          {item.available ? null : <Pill tone="danger">Unavailable</Pill>}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-faint">{item.id}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-channel">
                          <span>Uploaded by</span>
                          {item.user_id ? <UserRef id={item.user_id} size={16} /> : <span className="text-faint">unknown</span>}
                        </div>
                        <div className="mt-1 text-[11px] text-faint">
                          Created {formatDateTime(snowflakeDate(item.id))}
                        </div>
                        {item.roles.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.roles.map((roleId) => {
                              const role = roles[roleId];
                              const color = role ? roleColor(role.color) : null;
                              return (
                                <Pill key={roleId} title={roleId}>
                                  <span
                                    aria-hidden
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: color ?? "#99aab5" }}
                                  />
                                  {role?.name ?? roleId}
                                </Pill>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-1.5 text-[11px] text-faint">Usable by everyone</div>
                        )}
                        <div className="mt-1.5 flex gap-3 text-[11px]">
                          <a href={assetUrl(path)} download className="text-link hover:underline">
                            Download
                          </a>
                        </div>
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
            <RawDetails value={emoji} name="emoji.json" />
          </Section>
        </PageBody>
      )}
    </>
  );
}
