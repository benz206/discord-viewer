import { notFound } from "next/navigation";
import { Braces } from "lucide-react";

import { getGuild, getGuildAssets } from "@/lib/data/servers";
import { assetUrl, formatNumber } from "@/components/servers/format";
import { PageBody, PageHeader, Section } from "@/components/servers/page-shell";
import { RawFiles, type RawFile } from "@/components/servers/raw-files";

export default async function GuildRawPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const assets = getGuildAssets(guild);
  const files: RawFile[] = [
    { name: "guild.json", value: guild.guild },
    { name: "channels.json", value: guild.channels },
    { name: "audit-log.json", value: guild.auditLog },
    { name: "bans.json", value: guild.bans },
    { name: "emoji.json", value: guild.emoji },
    { name: "webhooks.json", value: guild.webhooks },
  ]
    .filter((file) => file.value !== null)
    .map((file) => ({ ...file, path: `servers/${guild.id}/${file.name}` }));

  const binaries = [
    ...(assets.icon ? [{ label: "icon", path: assets.icon }] : []),
    ...assets.emoji.map((asset) => ({ label: `emoji/${asset.id}`, path: asset.path })),
    ...assets.webhookAvatars.map((asset) => ({ label: `webhooks/${asset.hash}`, path: asset.path })),
  ];

  return (
    <>
      <PageHeader
        icon={<Braces />}
        title="Raw files"
        subtitle={`${guild.name} · ${files.length} JSON files · ${binaries.length} assets`}
      />
      <PageBody>
        <Section title={`JSON (${files.length})`} description={`Everything Discord exported under servers/${guild.id}/.`}>
          {files.length === 0 ? (
            <p className="text-sm text-faint">No JSON files were exported for this server.</p>
          ) : (
            <RawFiles files={files} />
          )}
        </Section>

        <Section title={`Assets (${formatNumber(binaries.length)})`}>
          {binaries.length === 0 ? (
            <p className="text-sm text-faint">No images were exported for this server.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {binaries.map((asset) => (
                <li key={asset.path} className="flex items-center gap-2 rounded bg-surface-2 px-3 py-1.5">
                  <img
                    src={assetUrl(asset.path)}
                    alt={asset.label}
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded bg-surface-3 object-contain"
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-channel">{asset.label}</span>
                  <a href={assetUrl(asset.path)} download className="shrink-0 text-xs text-link hover:underline">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </PageBody>
    </>
  );
}
