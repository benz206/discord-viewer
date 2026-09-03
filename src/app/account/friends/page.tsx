import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { listChannels } from "@/lib/data/channels";
import { getOwnerId, getUser } from "@/lib/data/meta";
import { RELATIONSHIP_TYPES } from "@/lib/data/types";
import { Avatar } from "@/components/common/avatar";
import { JsonViewer } from "@/components/common/json-viewer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { USER_FLAGS, decodeFlags } from "@/components/account/enums";
import { asRecord, asRecords, discordAvatarUrl, discriminatorTag, formatNumber } from "@/components/account/format";

export default function FriendsPage() {
  const user = getUser();
  if (!user) notFound();

  const ownerId = getOwnerId();
  const dmByUser = new Map<string, { id: string; messageCount: number }>();
  for (const channel of listChannels({ dm: true, limit: 2000 })) {
    for (const recipient of channel.recipients ?? []) {
      if (recipient === ownerId) continue;
      const existing = dmByUser.get(recipient);
      if (!existing || channel.messageCount > existing.messageCount) {
        dmByUser.set(recipient, { id: channel.id, messageCount: channel.messageCount });
      }
    }
  }

  const relationships = asRecords(user.relationships);
  const byType = new Map<number, typeof relationships>();
  for (const relationship of relationships) {
    const type = Number(relationship.type ?? -1);
    const bucket = byType.get(type) ?? [];
    bucket.push(relationship);
    byType.set(type, bucket);
  }

  return (
    <SettingsPage
      title="Friends"
      description={`${relationships.length} relationships from account/user.json, grouped by relationship type.`}
    >
      {[...byType.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([type, entries]) => (
          <Section
            key={type}
            title={`${RELATIONSHIP_TYPES[type] ?? `Type ${type}`} · type ${type}`}
            count={entries.length}
          >
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-divider">
                    <TableHead className="text-channel">User</TableHead>
                    <TableHead className="text-channel">Links</TableHead>
                    <TableHead className="text-channel">ID</TableHead>
                    <TableHead className="text-channel">Nickname</TableHead>
                    <TableHead className="text-channel">Avatar hash</TableHead>
                    <TableHead className="text-channel">Avatar decoration</TableHead>
                    <TableHead className="text-channel">Public flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((relationship) => {
                    const person = asRecord(relationship.user);
                    const id = String(person.id ?? relationship.id ?? "");
                    const avatarHash = typeof person.avatar === "string" ? person.avatar : null;
                    const publicFlags = Number(person.public_flags ?? 0);
                    const flags = decodeFlags(publicFlags, USER_FLAGS);
                    const dm = dmByUser.get(id);
                    return (
                      <TableRow key={String(relationship.id ?? id)} className="border-divider">
                        <TableCell>
                          <Link href={`/users/${id}`} className="inline-flex items-center gap-2 hover:underline">
                            <Avatar
                              src={discordAvatarUrl(id, avatarHash, 64)}
                              name={String(person.username ?? id)}
                              id={id}
                              size={28}
                            />
                            <span className="font-medium text-header">
                              {String(person.username ?? "unknown")}
                              <span className="text-channel">{discriminatorTag(person.discriminator)}</span>
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/users/${id}`} className="text-link hover:underline">
                              Profile
                            </Link>
                            {dm ? (
                              <Link
                                href={`/channels/@me/${dm.id}`}
                                className="inline-flex items-center gap-1 text-link hover:underline"
                                title={`${formatNumber(dm.messageCount)} messages`}
                              >
                                <MessageSquare className="size-3.5" /> DM
                              </Link>
                            ) : (
                              <span className="text-faint">no DM</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Mono>{id}</Mono>
                        </TableCell>
                        <TableCell>
                          {relationship.nickname ? (
                            String(relationship.nickname)
                          ) : (
                            <span className="text-faint">null</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {avatarHash ? <Mono>{avatarHash}</Mono> : <span className="text-faint">null</span>}
                        </TableCell>
                        <TableCell>
                          {person.avatar_decoration ? (
                            <Mono>{String(person.avatar_decoration)}</Mono>
                          ) : (
                            <span className="text-faint">null</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mono>{formatNumber(publicFlags)}</Mono>
                            {flags.map((flag) => (
                              <Pill key={flag.bit} tone={flag.known ? "brand" : "neutral"} title={`bit ${flag.bit}`}>
                                {flag.label}
                              </Pill>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </Section>
        ))}

      <Section title="Raw relationships" count={relationships.length}>
        <JsonViewer
          value={user.relationships}
          name="relationships"
          defaultExpandedDepth={0}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
