import { notFound } from "next/navigation";

import { getApplications, getUser } from "@/lib/data/meta";
import { AccountNav } from "@/components/account/account-nav";
import { asRecord } from "@/components/account/format";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!user) notFound();

  const counts = {
    settings: Object.keys(asRecord(user.settings)).length,
    connections: user.connections.length,
    relationships: user.relationships.length,
    notes: Object.keys(user.notes ?? {}).length,
    sessions: user.user_sessions.length,
    payments: user.payments.length,
    library: user.library_applications.length,
    guildSettings: user.guild_settings.length,
    applications: getApplications().length,
    activityStats: user.user_activity_application_statistics.length,
    friendSuggestions: user.friend_suggestions.length,
    externalFriends: user.external_friends_lists.length,
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface text-normal">
      <AccountNav counts={counts} />
      <main className="scrollbar-discord min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
