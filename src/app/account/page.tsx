import Link from "next/link";
import { notFound } from "next/navigation";
import { Braces, Download } from "lucide-react";

import { getUser, getUserAvatarPath } from "@/lib/data/meta";
import { Avatar } from "@/components/common/avatar";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { USER_FLAGS, describeFlags } from "@/components/account/enums";
import { asRecord, discriminatorTag, formatNumber, type Rec } from "@/components/account/format";

const COLLECTION_KEYS = new Set([
  "settings",
  "connections",
  "external_friends_lists",
  "friend_suggestions",
  "user_sessions",
  "relationships",
  "payments",
  "payment_sources",
  "guild_settings",
  "library_applications",
  "entitlements",
  "user_activity_application_statistics",
  "notes",
  "user_profile_metadata",
  "application_user_role_connections",
  "lobby_members",
  "user_achievements",
]);

export default function MyAccountPage() {
  const user = getUser();
  if (!user) notFound();

  const raw = user as unknown as Rec;
  const identity = Object.fromEntries(Object.entries(raw).filter(([key]) => !COLLECTION_KEYS.has(key)));
  const flags = describeFlags(user.flags, USER_FLAGS);
  const avatarPath = getUserAvatarPath();
  const avatarName = avatarPath ? avatarPath.split("/").pop() : null;
  const profileMetadata = asRecord(raw.user_profile_metadata);

  return (
    <SettingsPage
      title="My Account"
      description="Every field from account/user.json that describes the account itself."
      action={
        <Link
          href="/account/raw"
          className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2.5 py-1.5 text-sm text-interactive hover:bg-hover hover:text-interactive-hover"
        >
          <Braces className="size-4" /> Raw JSON
        </Link>
      }
    >
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar
          src={avatarPath ? `/api/asset/${avatarPath}` : null}
          name={user.username}
          id={user.id}
          size={80}
          status="online"
          ringColor="var(--color-surface-2)"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold text-header">
            {user.global_name ?? user.username}
            {user.discriminator === undefined ? (
              <span className="text-channel"> @{user.username}</span>
            ) : (
              <span className="text-channel">{discriminatorTag(user.discriminator)}</span>
            )}
          </p>
          <Mono className="block pt-0.5">{user.id}</Mono>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {user.verified ? <Pill tone="positive">Email verified</Pill> : <Pill tone="danger">Email unverified</Pill>}
            {user.has_mobile ? <Pill tone="brand">Mobile linked</Pill> : null}
            {user.premium_until ? <Pill tone="brand">Nitro</Pill> : null}
            {user.temp_banned_until ? <Pill tone="danger">Temp banned</Pill> : null}
          </div>
        </div>
        {avatarPath ? (
          <a
            href={`/api/asset/${avatarPath}`}
            className="inline-flex items-center gap-1.5 rounded bg-surface-3 px-2.5 py-1.5 text-sm text-interactive hover:text-interactive-hover"
          >
            <Download className="size-4" /> {avatarName}
          </a>
        ) : null}
      </Card>

      <Section title="Account fields" count={Object.keys(identity).length}>
        <Card>
          <FieldList
            value={identity}
            overrides={{
              id: <Mono>{user.id}</Mono>,
              email: <Mono>{user.email}</Mono>,
              phone: user.phone ? <Mono>{user.phone}</Mono> : <span className="text-faint">null</span>,
              ip: <Mono>{user.ip}</Mono>,
              avatar_hash: user.avatar_hash ? <Mono>{user.avatar_hash}</Mono> : <span className="text-faint">null</span>,
              discriminator: (
                <Mono>
                  {discriminatorTag(user.discriminator)} (raw {String(user.discriminator)})
                </Mono>
              ),
              flags: (
                <div className="flex flex-col gap-1.5">
                  {typeof user.flags === "number" ? (
                    <Mono>
                      {formatNumber(user.flags)} · 0x{user.flags.toString(16)} · 0b{user.flags.toString(2)}
                    </Mono>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {flags.length === 0 ? (
                      <span className="text-sm text-faint">No flags set</span>
                    ) : (
                      flags.map((flag) => (
                        <Pill key={flag.key} tone={flag.known ? "brand" : "neutral"} title={flag.title}>
                          {flag.label}
                        </Pill>
                      ))
                    )}
                  </div>
                </div>
              ),
            }}
          />
        </Card>
      </Section>

      <Section title="User profile metadata" count={Object.keys(profileMetadata).length}>
        <Card>
          <FieldList value={profileMetadata} />
        </Card>
      </Section>

      <Section title="Raw identity object">
        <JsonViewer value={identity} name="user" defaultExpandedDepth={1} className="max-h-[28rem]" />
      </Section>
    </SettingsPage>
  );
}
