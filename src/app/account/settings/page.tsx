import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Section, SettingsPage } from "@/components/account/section";
import { asRecord, humanizeKey } from "@/components/account/format";

export default function AccountSettingsPage() {
  const user = getUser();
  if (!user) notFound();

  const settings = asRecord(user.settings);
  const groups = Object.entries(settings);

  return (
    <SettingsPage title="Settings" description="The client settings blob stored on the account, expanded key by key.">
      {groups.map(([key, value]) => {
        const group = asRecord(value);
        return (
          <Section key={key} title={`settings.${key}`} count={Object.keys(group).length}>
            <Card>
              <FieldList value={group} />
            </Card>
            <JsonViewer value={value} name={key} defaultExpandedDepth={1} className="max-h-[26rem]" />
          </Section>
        );
      })}

      {groups.length === 0 ? <p className="text-sm text-faint">The settings object is empty.</p> : null}

      <Section
        title="Whole settings object"
        count={groups.length}
        description={groups.map(([key]) => humanizeKey(key)).join(", ")}
      >
        <JsonViewer value={settings} name="settings" defaultExpandedDepth={1} className="max-h-[32rem]" />
      </Section>
    </SettingsPage>
  );
}
