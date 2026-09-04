import { Download, Joystick } from "lucide-react";

import { getActivityGroups } from "@/lib/data/package-extras";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Card, Mono, Section, SettingsPage } from "@/components/account/section";
import { formatBytes, formatNumber } from "@/components/account/format";

export default function ActivitiesPage() {
  const groups = getActivityGroups();

  if (groups.length === 0) {
    return (
      <SettingsPage
        title="Activities"
        description="Per-activity state Discord keeps for the embedded games and apps you have played."
      >
        <Card className="p-0">
          <EmptyState
            icon={<Joystick />}
            title="No Activities folder"
            description="This package has no Activities/ folder. Discord adds one only when the account has played an embedded activity."
          />
        </Card>
      </SettingsPage>
    );
  }

  const fileCount = groups.reduce((sum, group) => sum + group.files.length, 0);

  return (
    <SettingsPage
      title="Activities"
      description={`Per-activity state Discord keeps for the embedded games and apps you have played — ${formatNumber(groups.length)} folders, ${formatNumber(fileCount)} files.`}
    >
      {groups.map((group) => (
        <Section key={group.name} title={group.name} count={group.files.length}>
          {group.files.length === 0 ? (
            <Card>
              <p className="text-sm text-faint">This folder is empty.</p>
            </Card>
          ) : (
            group.files.map((file) => (
              <Card key={file.assetPath} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Mono className="min-w-0 flex-1">{file.name}</Mono>
                  <span className="shrink-0 text-xs text-channel">{formatBytes(file.size)}</span>
                  <a
                    href={`/api/asset/${file.assetPath}`}
                    download
                    className="inline-flex shrink-0 items-center gap-1.5 rounded bg-surface-3 px-2 py-1 text-xs text-interactive hover:text-interactive-hover"
                  >
                    <Download className="size-3.5" /> Download
                  </a>
                </div>

                {file.json !== null ? (
                  <JsonViewer value={file.json} name={file.name} defaultExpandedDepth={2} className="max-h-[28rem]" />
                ) : file.text !== null ? (
                  <p className="rounded-md bg-surface-3 p-3 text-sm break-words whitespace-pre-wrap text-normal">
                    {file.text}
                  </p>
                ) : (
                  <p className="text-sm text-faint">
                    Not rendered inline — open the file directly with the download link.
                  </p>
                )}
              </Card>
            ))
          )}
        </Section>
      ))}
    </SettingsPage>
  );
}
