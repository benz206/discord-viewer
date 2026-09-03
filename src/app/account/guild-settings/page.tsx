import { notFound } from "next/navigation";

import { getChannel } from "@/lib/data/channels";
import { getUser } from "@/lib/data/meta";
import { listGuilds } from "@/lib/data/servers";
import { JsonViewer } from "@/components/common/json-viewer";
import { Section, SettingsPage } from "@/components/account/section";
import { GuildSettingsTable, type GuildSettingView } from "@/components/account/guild-settings-table";
import { asRecord, asRecords, formatNumber } from "@/components/account/format";

export default function GuildSettingsPage() {
  const user = getUser();
  if (!user) notFound();

  const guildNames = new Map(listGuilds().map((guild) => [guild.id, guild.name]));
  const settings = asRecords(user.guild_settings);

  const rows: GuildSettingView[] = settings.map((setting, index) => {
    const guildId = setting.guild_id === null || setting.guild_id === undefined ? null : String(setting.guild_id);
    const guildName = guildId ? (guildNames.get(guildId) ?? null) : null;
    const overrides = asRecords(setting.channel_overrides).map((override) => {
      const channelId = String(override.channel_id ?? "");
      const channel = channelId ? getChannel(channelId) : null;
      return {
        channelId,
        channelName: channel ? (channel.name ?? channel.indexName ?? channel.id) : null,
        channelLink: channel
          ? channel.guildId
            ? `/channels/${channel.guildId}/${channel.id}`
            : `/channels/@me/${channel.id}`
          : null,
        raw: override,
      };
    });

    return {
      key: guildId ?? `global-${index}`,
      guildId,
      guildName,
      guildLink: guildId && guildName ? `/servers/${guildId}` : null,
      overrides,
      raw: setting,
    };
  });

  rows.sort((a, b) => {
    if (!a.guildId) return -1;
    if (!b.guildId) return 1;
    if (a.guildName && b.guildName) return a.guildName.localeCompare(b.guildName);
    if (a.guildName) return -1;
    if (b.guildName) return 1;
    return a.guildId.localeCompare(b.guildId);
  });

  const overrideCount = rows.reduce((total, row) => total + row.overrides.length, 0);
  const mutedCount = rows.filter((row) => Boolean(asRecord(row.raw).muted)).length;

  return (
    <SettingsPage
      title="Guild Settings"
      description={`${formatNumber(rows.length)} per-guild notification settings · ${formatNumber(mutedCount)} muted · ${formatNumber(overrideCount)} channel overrides. Guild names resolve only for the ${guildNames.size} guilds present in the package.`}
    >
      <GuildSettingsTable rows={rows} />

      <Section title="Raw guild_settings" count={rows.length}>
        <JsonViewer
          value={user.guild_settings}
          name="guild_settings"
          defaultExpandedDepth={0}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
