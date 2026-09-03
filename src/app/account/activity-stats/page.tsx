import { notFound } from "next/navigation";

import { getApplications, getUser } from "@/lib/data/meta";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Card, Mono, Section, SettingsPage } from "@/components/account/section";
import { asRecords, formatDateTime, formatDuration, formatNumber } from "@/components/account/format";

export default function ActivityStatsPage() {
  const user = getUser();
  if (!user) notFound();

  const appNames = new Map(getApplications().map((entry) => [entry.application.id, entry.application.name]));
  const stats = asRecords(user.user_activity_application_statistics)
    .map((stat) => ({ stat, duration: Number(stat.total_duration ?? 0) }))
    .sort((a, b) => b.duration - a.duration);
  const longest = stats.reduce((max, entry) => Math.max(max, entry.duration), 0);
  const total = stats.reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <SettingsPage
      title="Activity Statistics"
      description={`Per-application playtime Discord recorded for this account · ${formatDuration(total)} total.`}
    >
      {stats.length === 0 ? (
        <EmptyState title="No application statistics" description="user_activity_application_statistics is empty." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
                <th className="px-3 py-2 font-semibold">Application ID</th>
                <th className="px-3 py-2 font-semibold">Last played</th>
                <th className="px-3 py-2 font-semibold">Total duration</th>
                <th className="px-3 py-2 font-semibold">Discord SKU duration</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ stat, duration }) => {
                const id = String(stat.application_id);
                const skuDuration = Number(stat.total_discord_sku_duration ?? 0);
                return (
                  <tr key={id} className="border-b border-divider last:border-0">
                    <td className="px-3 py-2">
                      <Mono>{id}</Mono>
                      {appNames.has(id) ? (
                        <span className="ml-2 text-header">{appNames.get(id)}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(stat.last_played_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-surface-3">
                          <span
                            className="block h-full rounded-full bg-brand"
                            style={{ width: `${longest > 0 ? (duration / longest) * 100 : 0}%` }}
                          />
                        </span>
                        <span className="whitespace-nowrap">{formatDuration(duration)}</span>
                        <span className="text-faint">({formatNumber(duration)}s)</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDuration(skuDuration)} <span className="text-faint">({formatNumber(skuDuration)}s)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Section title="Raw user_activity_application_statistics" count={stats.length}>
        <JsonViewer
          value={user.user_activity_application_statistics}
          name="user_activity_application_statistics"
          defaultExpandedDepth={1}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
