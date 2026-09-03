import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { CONNECTION_COLORS, CONNECTION_VISIBILITY, enumName } from "@/components/account/enums";
import { asRecords, humanizeKey } from "@/components/account/format";

export default function ConnectionsPage() {
  const user = getUser();
  if (!user) notFound();

  const connections = asRecords(user.connections);

  return (
    <SettingsPage title="Connections" description="Third-party accounts linked to this Discord account.">
      {connections.length === 0 ? (
        <EmptyState title="No connections" description="account/user.json contains an empty connections array." />
      ) : null}

      {connections.map((connection) => {
        const type = String(connection.type ?? "unknown");
        return (
          <Card key={`${type}-${String(connection.id)}`} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ backgroundColor: CONNECTION_COLORS[type] ?? "var(--color-elevated)" }}
              >
                {type.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-header">{String(connection.name ?? "—")}</p>
                <p className="text-xs text-channel">{humanizeKey(type)}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {connection.verified ? <Pill tone="positive">Verified</Pill> : <Pill>Unverified</Pill>}
                {connection.revoked ? <Pill tone="danger">Revoked</Pill> : null}
                <Pill tone="brand">{enumName(CONNECTION_VISIBILITY, connection.visibility)}</Pill>
              </div>
            </div>
            <FieldList
              value={connection}
              overrides={{
                id: <Mono>{String(connection.id)}</Mono>,
                visibility: (
                  <span>
                    {enumName(CONNECTION_VISIBILITY, connection.visibility)}{" "}
                    <span className="text-faint">({String(connection.visibility)})</span>
                  </span>
                ),
                metadata_visibility: (
                  <span>
                    {enumName(CONNECTION_VISIBILITY, connection.metadata_visibility)}{" "}
                    <span className="text-faint">({String(connection.metadata_visibility)})</span>
                  </span>
                ),
              }}
            />
          </Card>
        );
      })}

      <Section title="Raw connections" count={connections.length}>
        <JsonViewer value={user.connections} name="connections" defaultExpandedDepth={1} className="max-h-[28rem]" />
      </Section>
    </SettingsPage>
  );
}
