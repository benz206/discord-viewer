import { Download, Megaphone } from "lucide-react";

import { getAds } from "@/lib/data/package-extras";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { formatDate, formatNumber } from "@/components/account/format";

function questState(quest: Record<string, unknown>): { label: string; tone: "positive" | "brand" | "neutral" } {
  if (quest.claimed_at) return { label: "Claimed", tone: "positive" };
  if (quest.completed_at) return { label: "Completed", tone: "brand" };
  return { label: "Enrolled", tone: "neutral" };
}

export default function AdsPage() {
  const { traits, traitsAssetPath, questStatus, questStatusAssetPath } = getAds();

  if (!traits && questStatus.length === 0) {
    return (
      <SettingsPage title="Ads & Quests" description="Ad-targeting traits and quest participation from the Ads folder.">
        <Card className="p-0">
          <EmptyState
            icon={<Megaphone />}
            title="No Ads folder"
            description="This package has no Ads/ folder. Discord adds one only when the account has ad-targeting traits or quest history."
          />
        </Card>
      </SettingsPage>
    );
  }

  const claimed = questStatus.filter((quest) => quest.claimed_at).length;
  const completed = questStatus.filter((quest) => quest.completed_at).length;

  return (
    <SettingsPage
      title="Ads & Quests"
      description="The traits Discord derives to target ads at this account, and every quest it was enrolled in."
    >
      {traits ? (
        <Section
          title="Targeting traits"
          count={Object.keys(traits).length}
          description="Ads/traits.json — the profile Discord built from games played, platform, region and subscription state."
          action={
            traitsAssetPath ? (
              <a
                href={`/api/asset/${traitsAssetPath}`}
                download
                className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2 py-1 text-xs text-interactive hover:text-interactive-hover"
              >
                <Download className="size-3.5" /> traits.json
              </a>
            ) : null
          }
        >
          <Card>
            <FieldList value={traits} />
          </Card>
        </Section>
      ) : null}

      <Section
        title="Quest status"
        count={questStatus.length}
        description={
          questStatus.length > 0
            ? `Ads/quests_user_status.json — ${formatNumber(completed)} completed, ${formatNumber(claimed)} rewards claimed.`
            : "Ads/quests_user_status.json is empty."
        }
        action={
          questStatusAssetPath ? (
            <a
              href={`/api/asset/${questStatusAssetPath}`}
              download
              className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2 py-1 text-xs text-interactive hover:text-interactive-hover"
            >
              <Download className="size-3.5" /> quests_user_status.json
            </a>
          ) : null
        }
      >
        {questStatus.length === 0 ? (
          <Card className="p-0">
            <EmptyState icon={<Megaphone />} title="No quests" description="This account was never enrolled in a quest." />
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-divider text-left text-xs tracking-wide text-channel uppercase">
                  <th className="px-4 py-2 font-bold">Quest</th>
                  <th className="px-4 py-2 font-bold">Enrolled</th>
                  <th className="px-4 py-2 font-bold">Completed</th>
                  <th className="px-4 py-2 font-bold">Claimed</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {questStatus.map((quest, index) => {
                  const state = questState(quest);
                  return (
                    <tr key={String(quest.quest_id ?? index)} className="border-b border-divider/60 last:border-0">
                      <td className="px-4 py-2">
                        <Mono>{String(quest.quest_id ?? "—")}</Mono>
                      </td>
                      <td className="px-4 py-2 text-channel">{formatDate(quest.enrolled_at)}</td>
                      <td className="px-4 py-2 text-channel">{formatDate(quest.completed_at)}</td>
                      <td className="px-4 py-2 text-channel">{formatDate(quest.claimed_at)}</td>
                      <td className="px-4 py-2">
                        <Pill tone={state.tone}>{state.label}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      <Section title="Raw Ads data">
        <JsonViewer
          value={{ traits, quests_user_status: questStatus }}
          name="ads"
          defaultExpandedDepth={1}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
