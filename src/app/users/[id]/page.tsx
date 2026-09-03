import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";

import { listChannelsForUser } from "@/lib/data/channels";
import { getApplications, getUser } from "@/lib/data/meta";
import { getGuild, listGuilds } from "@/lib/data/servers";
import { getUserEntry } from "@/lib/data/users";
import { RELATIONSHIP_TYPES, channelTypeName } from "@/lib/data/types";
import { Avatar } from "@/components/common/avatar";
import { USER_SOURCE_LABELS } from "@/components/servers/constants";
import { DefinitionList, ScalarValue } from "@/components/servers/definition-list";
import { assetUrl, formatDateTime, formatNumber, snowflakeDate } from "@/components/servers/format";
import { PageBody, PageHeader, PageShell, Pill, Section, SidebarHeader } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import { guildPeople } from "@/components/servers/people";
import { userAvatarUrl, userDisplayName } from "@/components/users/user-avatar";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const entry = getUserEntry(id);
  const account = getUser();
  const relationship = account?.relationships.find((item) => item.user.id === id) ?? null;
  const note = entry?.note ?? account?.notes?.[id] ?? null;
  const isOwner = account?.id === id;

  const name = entry ? userDisplayName(entry) : id;
  const avatarHash = entry?.avatar ?? relationship?.user.avatar ?? null;

  const shared = listChannelsForUser(id);
  const dms = shared.filter((channel) => channel.type === 1);
  const groupDms = shared.filter((channel) => channel.type === 3);

  const guildHits = listGuilds()
    .map((row) => {
      const guild = getGuild(row.id);
      if (!guild) return null;
      const person = guildPeople(guild).find((item) => item.id === id);
      return person ? { guild: row, reasons: person.reasons } : null;
    })
    .filter((hit): hit is { guild: ReturnType<typeof listGuilds>[number]; reasons: string[] } => hit !== null);

  const applications = getApplications().filter(
    (item) => item.application.id === id || item.application.bot?.id === id,
  );

  const created = snowflakeDate(id);

  return (
    <PageShell
      sidebar={
        <>
          <SidebarHeader title="User" subtitle={name} />
          <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto p-3">
            <Link
              href="/users"
              className="mb-3 flex items-center gap-1 text-[11px] font-semibold tracking-wide text-channel uppercase hover:text-interactive-hover"
            >
              <ChevronLeft className="size-3.5" /> All users
            </Link>
            <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-3 p-4 text-center">
              <Avatar src={userAvatarUrl(id, avatarHash, entry?.discriminator)} name={entry?.name ?? id} id={id} size={72} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-header">{name}</div>
                <div className="truncate font-mono text-[10px] text-faint">{id}</div>
              </div>
              {isOwner ? <Pill tone="positive">Package owner</Pill> : null}
            </div>
            <ul className="mt-3 flex flex-wrap gap-1">
              {(entry?.sources ?? []).map((source) => (
                <li key={source}>
                  <Pill tone="brand">{USER_SOURCE_LABELS[source] ?? source}</Pill>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      <PageHeader icon={<User />} title={name} subtitle={id} />
      <PageBody>
        {!entry ? (
          <div className="mb-6 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
            This id is not in the indexed user directory. Everything below was gathered from the raw package files.
          </div>
        ) : null}

        <Section title="Identity">
          <DefinitionList
            fields={[
              { key: "id", label: "User ID", value: id, mono: true },
              { key: "username", label: "Username", value: <ScalarValue value={entry?.name ?? relationship?.user.username ?? null} /> },
              {
                key: "discriminator",
                label: "Discriminator",
                value: <ScalarValue value={entry?.discriminator ?? relationship?.user.discriminator ?? null} />,
              },
              {
                key: "avatar",
                label: "Avatar hash",
                value: avatarHash ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] break-all">{avatarHash}</span>
                    <a
                      href={userAvatarUrl(id, avatarHash, entry?.discriminator)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link hover:underline"
                    >
                      open on cdn
                    </a>
                  </span>
                ) : (
                  <ScalarValue value={null} />
                ),
              },
              { key: "created", label: "Account created", value: formatDateTime(created) },
              {
                key: "sources",
                label: "Appears in",
                value: (entry?.sources ?? []).length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {(entry?.sources ?? []).map((source) => (
                      <Pill key={source} tone="brand">
                        {USER_SOURCE_LABELS[source] ?? source}
                      </Pill>
                    ))}
                  </span>
                ) : (
                  <ScalarValue value={null} />
                ),
              },
              {
                key: "bot",
                label: "Bot",
                value: <ScalarValue value={relationship?.user.bot ?? null} />,
              },
              {
                key: "public_flags",
                label: "Public flags",
                value: <ScalarValue value={relationship?.user.public_flags ?? null} />,
              },
            ]}
          />
        </Section>

        <Section title="Relationship & note">
          <DefinitionList
            fields={[
              {
                key: "relationship",
                label: "Relationship",
                value: relationship ? (
                  <span>
                    {RELATIONSHIP_TYPES[relationship.type] ?? "Unknown"}{" "}
                    <span className="text-faint">(type {relationship.type})</span>
                  </span>
                ) : (
                  <span className="text-faint">not in your relationship list</span>
                ),
              },
              {
                key: "nickname",
                label: "Friend nickname",
                value: <ScalarValue value={relationship?.nickname ?? null} />,
              },
              {
                key: "note",
                label: "Your note",
                value: note ? (
                  <span className="whitespace-pre-wrap">{note}</span>
                ) : (
                  <span className="text-faint">no note</span>
                ),
              },
            ]}
          />
        </Section>

        <Section title={`Direct messages (${dms.length + groupDms.length})`}>
          {dms.length + groupDms.length === 0 ? (
            <p className="text-sm text-faint">No DM channel with this user was exported.</p>
          ) : (
            <ul className="space-y-1.5">
              {[...dms, ...groupDms].map((channel) => (
                <li key={channel.id}>
                  <Link
                    href={`/channels/@me/${channel.id}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 transition-colors hover:bg-hover"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-header">
                      {channel.indexName ?? channel.name ?? channel.id}
                    </span>
                    <Pill>{channelTypeName(channel.type)}</Pill>
                    <span className="text-xs text-channel">{formatNumber(channel.messageCount)} messages</span>
                    <span className="text-xs text-faint">
                      {channel.firstTs ? formatDateTime(channel.firstTs) : "—"} →{" "}
                      {channel.lastTs ? formatDateTime(channel.lastTs) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Servers (${guildHits.length})`}>
          {guildHits.length === 0 ? (
            <p className="text-sm text-faint">This user does not appear in any exported server file.</p>
          ) : (
            <ul className="space-y-1.5">
              {guildHits.map((hit) => (
                <li key={hit.guild.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <Avatar
                    src={hit.guild.iconFile ? assetUrl(hit.guild.iconFile) : null}
                    name={hit.guild.name}
                    id={hit.guild.id}
                    size={28}
                    rounded="lg"
                  />
                  <Link href={`/servers/${hit.guild.id}`} className="min-w-0 flex-1 truncate text-sm text-link hover:underline">
                    {hit.guild.name}
                  </Link>
                  <span className="flex flex-wrap justify-end gap-1">
                    {hit.reasons.map((reason) => (
                      <Pill key={reason} tone="brand">
                        {reason}
                      </Pill>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {applications.length > 0 ? (
          <Section title={`Applications (${applications.length})`}>
            <ul className="space-y-1.5">
              {applications.map((item) => (
                <li key={item.application.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <Avatar
                    src={item.iconPath ? assetUrl(item.iconPath) : null}
                    name={item.application.name}
                    id={item.application.id}
                    size={28}
                    rounded="lg"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-header">{item.application.name}</span>
                  <span className="font-mono text-[11px] text-faint">{item.application.id}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Raw">
          <RawDetails label="Directory entry" value={entry ?? { id, indexed: false }} name="user" />
          {relationship ? <RawDetails label="Relationship entry" value={relationship} name="relationship" /> : null}
        </Section>
      </PageBody>
    </PageShell>
  );
}
