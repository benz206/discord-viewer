import { Braces } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Card, Section, SettingsPage } from "@/components/account/section";
import { FieldList } from "@/components/account/field-list";
import { asRecord } from "@/components/account/format";

export function CollectionPage({
  title,
  description,
  field,
  value,
}: {
  title: string;
  description: string;
  field: string;
  value: unknown;
}) {
  const entries = Array.isArray(value) ? value : [];

  return (
    <SettingsPage title={title} description={description}>
      {entries.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Braces />}
            title={`${field} is empty`}
            description={`Discord exported this key as an empty array, so there is nothing in the package for ${title.toLowerCase()}.`}
          />
        </Card>
      ) : (
        entries.map((entry, index) => (
          <Card key={index}>
            <FieldList value={asRecord(entry)} />
          </Card>
        ))
      )}

      <Section title={`Raw ${field}`} count={entries.length}>
        <JsonViewer value={value} name={field} defaultExpandedDepth={1} className="max-h-[20rem]" />
      </Section>
    </SettingsPage>
  );
}
