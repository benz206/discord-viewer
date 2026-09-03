import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { ChannelRef } from "@/components/servers/channel-ref";
import {
  Blank,
  DefinitionList,
  Mono,
  ScalarValue,
  type DefinitionField,
} from "@/components/servers/definition-list";
import { assetUrl, formatDuration, formatNumber, snowflakeDate, formatDateTime } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import {
  EXPLICIT_CONTENT_FILTERS,
  GUILD_FEATURE_LABELS,
  MESSAGE_NOTIFICATION_LEVELS,
  MFA_LEVELS,
  NSFW_LEVELS,
  PREMIUM_TIERS,
  SYSTEM_CHANNEL_FLAGS,
  VERIFICATION_LEVELS,
  decodeFlags,
} from "@/components/servers/constants";
import { UserRef } from "@/components/users/user-ref";

const FIELD_ORDER = [
  "id",
  "name",
  "description",
  "owner_id",
  "region",
  "preferred_locale",
  "verification_level",
  "explicit_content_filter",
  "default_message_notifications",
  "mfa_level",
  "nsfw_level",
  "premium_tier",
  "features",
  "vanity_url_code",
  "system_channel_id",
  "system_channel_flags",
  "rules_channel_id",
  "public_updates_channel_id",
  "afk_channel_id",
  "afk_timeout",
  "widget_enabled",
  "widget_channel_id",
  "icon_hash",
  "splash_hash",
  "discovery_splash_hash",
  "banner_hash",
  "max_members",
  "max_presences",
  "application_id",
  "emoji_rev",
  "sticker_rev",
  "custom_regions",
  "data",
  "roles",
];

function humanize(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function enumValue(table: Record<number, string>, value: unknown) {
  if (typeof value !== "number") return <ScalarValue value={value} />;
  return (
    <span>
      {table[value] ?? "Unknown"} <span className="text-faint">({value})</span>
    </span>
  );
}

export default async function GuildOverviewPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const json = guild.guild;
  if (!json) {
    return (
      <>
        <PageHeader icon={<Settings />} title="Overview" subtitle={guild.name} />
        <MissingFile file="guild.json" what="server overview" />
      </>
    );
  }

  const record = json as unknown as Record<string, unknown>;
  const keys = [
    ...FIELD_ORDER.filter((key) => key in record),
    ...Object.keys(record).filter((key) => !FIELD_ORDER.includes(key)),
  ];

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    switch (key) {
      case "id":
      case "application_id":
      case "emoji_rev":
      case "sticker_rev":
      case "icon_hash":
      case "splash_hash":
      case "discovery_splash_hash":
      case "banner_hash":
        return value ? <Mono>{String(value)}</Mono> : <Blank>null</Blank>;
      case "owner_id":
        return typeof value === "string" ? <UserRef id={value} /> : <Blank>null</Blank>;
      case "verification_level":
        return enumValue(VERIFICATION_LEVELS, value);
      case "explicit_content_filter":
        return enumValue(EXPLICIT_CONTENT_FILTERS, value);
      case "default_message_notifications":
        return enumValue(MESSAGE_NOTIFICATION_LEVELS, value);
      case "mfa_level":
        return enumValue(MFA_LEVELS, value);
      case "nsfw_level":
        return enumValue(NSFW_LEVELS, value);
      case "premium_tier":
        return enumValue(PREMIUM_TIERS, value);
      case "afk_timeout":
        return typeof value === "number" ? (
          <span>
            {formatDuration(value)} <span className="text-faint">({value}s)</span>
          </span>
        ) : (
          <ScalarValue value={value} />
        );
      case "system_channel_id":
      case "rules_channel_id":
      case "public_updates_channel_id":
      case "afk_channel_id":
      case "widget_channel_id":
        return typeof value === "string" ? (
          <span className="flex flex-wrap items-center gap-2">
            <ChannelRef guildId={guild.id} id={value} />
            <Mono>{value}</Mono>
          </span>
        ) : (
          <Blank>null</Blank>
        );
      case "system_channel_flags": {
        const flags = decodeFlags(typeof value === "number" ? value : 0, SYSTEM_CHANNEL_FLAGS);
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <Mono>{String(value)}</Mono>
            {flags.length === 0 ? (
              <span className="text-channel">no suppressions</span>
            ) : (
              flags.map((flag) => (
                <Pill key={flag} tone="warning">
                  {flag}
                </Pill>
              ))
            )}
          </span>
        );
      }
      case "features": {
        const features = Array.isArray(value) ? (value as string[]) : [];
        if (features.length === 0) return <Blank>no features</Blank>;
        return (
          <span className="flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <Pill key={feature} tone="brand" title={feature}>
                {GUILD_FEATURE_LABELS[feature] ?? feature}
              </Pill>
            ))}
          </span>
        );
      }
      case "roles": {
        const count = value && typeof value === "object" ? Object.keys(value as object).length : 0;
        return (
          <Link href={`/servers/${guild.id}/roles`} className="text-link hover:underline">
            {formatNumber(count)} roles
          </Link>
        );
      }
      case "max_members":
      case "max_presences":
        return typeof value === "number" ? <span>{formatNumber(value)}</span> : <Blank>null</Blank>;
      default:
        return <ScalarValue value={value} />;
    }
  };

  const fields: DefinitionField[] = keys.map((key) => ({
    key,
    label: humanize(key),
    value: renderValue(key, record[key]),
  }));

  const created = snowflakeDate(json.id);

  return (
    <>
      <PageHeader icon={<Settings />} title="Overview" subtitle={guild.name} />
      <PageBody>
        <Section title="Server profile">
          <div className="flex items-start gap-4 rounded-lg bg-surface-2 p-4">
            {guild.iconFile ? (
              <img
                src={assetUrl(guild.iconFile)}
                alt={`${guild.name} icon`}
                width={80}
                height={80}
                className="size-20 rounded-2xl bg-surface-3 object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-2xl bg-surface-3 text-xs text-faint">
                no icon
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xl font-semibold text-header">{json.name}</div>
              <p className="mt-1 text-sm text-channel">{json.description || "No description set."}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill>Created {formatDateTime(created)}</Pill>
                <Pill>{formatNumber(guild.roleCount)} roles</Pill>
                <Pill>{formatNumber(guild.channelCount)} channels</Pill>
                <Pill>{formatNumber(guild.emojiCount)} emoji</Pill>
                <Pill>{formatNumber(guild.messageCount)} exported messages</Pill>
              </div>
              {guild.iconFile ? (
                <a
                  href={assetUrl(guild.iconFile)}
                  className="mt-2 inline-block text-xs text-link hover:underline"
                  download
                >
                  Download icon ({guild.iconFile.split("/").pop()})
                </a>
              ) : null}
            </div>
          </div>
        </Section>

        <Section title={`guild.json (${fields.length} fields)`}>
          <DefinitionList fields={fields} />
          <RawDetails value={json} name="guild.json" />
        </Section>
      </PageBody>
    </>
  );
}
