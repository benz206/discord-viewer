import { notFound } from "next/navigation";

import { getApplications, getUser } from "@/lib/data/meta";
import { getActivityGroups, getAds, getDataExports, getSupportTickets } from "@/lib/data/package-extras";
import { AccountNav } from "@/components/account/account-nav";
import { asRecord } from "@/components/account/format";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!user) notFound();

  const dataExports = getDataExports();
  const ads = getAds();

  const counts = {
    settings: Object.keys(asRecord(user.settings)).length,
    connections: user.connections.length,
    relationships: user.relationships.length,
    notes: Object.keys(user.notes ?? {}).length,
    sessions: user.user_sessions.length,
    // Billing lives in user.json in older packages and in user_data_exports in newer ones.
    payments:
      user.payments?.length ??
      dataExports.find((section) => section.slug === "payments")?.recordCount ??
      0,
    library: user.library_applications.length,
    guildSettings: user.guild_settings.length,
    applications: getApplications().length,
    activityStats: user.user_activity_application_statistics.length,
    friendSuggestions: user.friend_suggestions.length,
    externalFriends: user.external_friends_lists.length,
    dataExports: dataExports.length,
    ads: ads.questStatus.length,
    supportTickets: getSupportTickets().tickets.length,
    activities: getActivityGroups().length,
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface text-normal">
      <AccountNav counts={counts} />
      <main className="scrollbar-discord min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
