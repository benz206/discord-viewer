import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { EmptyState } from "@/components/common/empty-state";
import { guildPeople } from "@/components/servers/people";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { UserRef } from "@/components/users/user-ref";

export default async function GuildMembersPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const people = guildPeople(guild);

  return (
    <>
      <PageHeader icon={<Users />} title="People seen" subtitle={`${guild.name} · ${people.length} users`} />
      {people.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No users referenced"
          description="Discord never exports a member list. This page collects every user id that appears anywhere in this server's files, and nothing in this export mentions one."
        />
      ) : (
        <PageBody>
          <Section
            title={`Referenced users (${people.length})`}
            description="Discord does not export member lists. These are the user ids that appear somewhere in this server's files."
          >
            <ul className="space-y-1.5">
              {people.map((person) => (
                <li key={person.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <UserRef id={person.id} size={28} />
                  <span className="font-mono text-[11px] text-faint">{person.id}</span>
                  <span className="ml-auto flex flex-wrap gap-1.5">
                    {person.reasons.map((reason) => (
                      <Pill key={reason} tone="brand">
                        {reason}
                      </Pill>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </PageBody>
      )}
    </>
  );
}
