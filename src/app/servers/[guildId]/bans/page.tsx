import { notFound } from "next/navigation";
import { Ban } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { EmptyState } from "@/components/common/empty-state";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Section } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import { UserRef } from "@/components/users/user-ref";

export default async function GuildBansPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const bans = guild.bans;
  if (!bans) {
    return (
      <>
        <PageHeader icon={<Ban />} title="Bans" subtitle={guild.name} />
        <MissingFile file="bans.json" what="ban" />
      </>
    );
  }

  return (
    <>
      <PageHeader icon={<Ban />} title="Bans" subtitle={`${guild.name} · ${bans.length} bans`} />
      {bans.length === 0 ? (
        <EmptyState icon={<Ban />} title="No bans" description="bans.json exists for this server but is empty." />
      ) : (
        <PageBody>
          <Section title={`Banned users (${bans.length})`}>
            <div className="overflow-hidden rounded-lg bg-surface-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">User ID</th>
                    <th className="px-4 py-2 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {bans.map((ban) => (
                    <tr key={ban.user_id} className="border-b border-divider last:border-0">
                      <td className="px-4 py-2">
                        <UserRef id={ban.user_id} />
                      </td>
                      <td className="px-4 py-2 font-mono text-[12px] text-faint">{ban.user_id}</td>
                      <td className="px-4 py-2 text-normal">
                        {ban.reason ?? <span className="text-faint">no reason recorded</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <RawDetails value={bans} name="bans.json" />
          </Section>
        </PageBody>
      )}
    </>
  );
}
