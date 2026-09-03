import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { getUser } from "@/lib/data/meta";
import { JsonViewer } from "@/components/common/json-viewer";
import { Card, Section, SettingsPage } from "@/components/account/section";
import { asRecord, formatNumber, type Rec } from "@/components/account/format";

function describe(value: unknown): string {
  if (Array.isArray(value)) return `array · ${formatNumber(value.length)} items`;
  if (value === null) return "null";
  if (typeof value === "object") return `object · ${formatNumber(Object.keys(value as Rec).length)} keys`;
  return typeof value;
}

export default function RawAccountPage() {
  const user = getUser();
  if (!user) notFound();

  const raw = user as unknown as Rec;
  const keys = Object.keys(raw);

  return (
    <SettingsPage
      title="Raw user.json"
      description="The complete account/user.json exactly as Discord exported it. Nothing is redacted — this is the owner's own data."
      action={
        <a
          href="/api/asset/account/user.json"
          download
          className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2.5 py-1.5 text-sm text-interactive hover:bg-hover hover:text-interactive-hover"
        >
          <Download className="size-4" /> Download user.json
        </a>
      }
    >
      <Section title="Top level keys" count={keys.length}>
        <Card>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {keys.map((key) => (
              <li key={key} className="flex items-baseline justify-between gap-3 border-b border-divider/60 py-1">
                <span className="font-mono text-[12px] text-mention-fg">{key}</span>
                <span className="text-xs text-channel">{describe(raw[key])}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="user.json">
        <JsonViewer value={raw} name="user" defaultExpandedDepth={1} chunkSize={100} className="max-h-[70vh]" />
      </Section>

      <Section title="user_profile_metadata" count={Object.keys(asRecord(raw.user_profile_metadata)).length}>
        <JsonViewer value={raw.user_profile_metadata} name="user_profile_metadata" defaultExpandedDepth={2} />
      </Section>
    </SettingsPage>
  );
}
