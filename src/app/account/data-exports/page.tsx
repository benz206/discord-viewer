import { Braces, Download } from "lucide-react";

import { getDataExports } from "@/lib/data/package-extras";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { FieldList } from "@/components/account/field-list";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { formatDateTime, formatNumber, humanizeKey } from "@/components/account/format";

export default function DataExportsPage() {
  const sections = getDataExports();

  if (sections.length === 0) {
    return (
      <SettingsPage
        title="Data Exports"
        description="Tabular exports Discord ships under account/user_data_exports."
      >
        <Card className="p-0">
          <EmptyState
            icon={<Braces />}
            title="No data exports"
            description="This package has no account/user_data_exports folder. Older exports inlined billing and store data into account/user.json instead."
          />
        </Card>
      </SettingsPage>
    );
  }

  const schemas = [...new Set(sections.map((section) => section.schema))];
  const generatedAt = sections.find((section) => section.generatedAt)?.generatedAt ?? null;
  const totalRecords = sections.reduce((sum, section) => sum + section.recordCount, 0);

  return (
    <SettingsPage
      title="Data Exports"
      description={`Tabular exports Discord ships under account/user_data_exports — ${formatNumber(sections.length)} files across ${formatNumber(schemas.length)} schemas, ${formatNumber(totalRecords)} records in total${generatedAt ? `, generated ${formatDateTime(generatedAt)}` : ""}.`}
    >
      {schemas.map((schema) => {
        const schemaSections = sections.filter((section) => section.schema === schema);
        return (
          <Section
            key={schema}
            title={humanizeKey(schema.replace(/^discord_/, ""))}
            count={schemaSections.length}
            description={schemaSections[0]?.schemaDescription ?? undefined}
          >
            {schemaSections.map((section) => (
              <Card key={`${section.schema}/${section.slug}`} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-header">{section.section}</span>
                  <Pill tone={section.recordCount > 0 ? "brand" : "neutral"}>
                    {formatNumber(section.recordCount)} {section.recordCount === 1 ? "record" : "records"}
                  </Pill>
                  <a
                    href={`/api/asset/${section.assetPath}`}
                    download
                    className="inline-flex items-center gap-1.5 rounded bg-surface-3 px-2 py-1 text-xs text-interactive hover:text-interactive-hover"
                  >
                    <Download className="size-3.5" /> {section.slug}.json
                  </a>
                </div>

                {section.description ? <p className="text-sm text-channel">{section.description}</p> : null}

                {section.columns.length > 0 ? (
                  <details className="rounded-md bg-surface-3 p-3">
                    <summary className="cursor-pointer text-xs font-bold tracking-wide text-header uppercase">
                      Columns <span className="ml-1 font-medium text-channel">{section.columns.length}</span>
                    </summary>
                    <dl className="mt-2 flex flex-col gap-1.5">
                      {section.columns.map((column, index) => (
                        <div key={`${column.name}-${index}`} className="flex flex-wrap items-baseline gap-2">
                          <dt className="text-sm font-medium text-subhead">{column.name}</dt>
                          {column.description ? (
                            <dd className="min-w-0 flex-1 text-sm text-channel">{column.description}</dd>
                          ) : null}
                        </div>
                      ))}
                    </dl>
                  </details>
                ) : null}

                {section.records.length === 0 ? (
                  <p className="text-sm text-faint">Discord exported this section with no rows.</p>
                ) : (
                  section.records.map((record, index) => (
                    <div key={index} className="rounded-md bg-surface-3 p-3">
                      <FieldList value={record} compact />
                    </div>
                  ))
                )}
              </Card>
            ))}
          </Section>
        );
      })}

      <Section title="Raw sections" count={sections.length}>
        <JsonViewer
          value={Object.fromEntries(
            sections.map((section) => [`${section.schema}/${section.slug}`, section.records]),
          )}
          name="user_data_exports"
          defaultExpandedDepth={1}
          className="max-h-[28rem]"
        />
      </Section>

      <Section title="Files">
        <Card>
          <ul className="flex flex-col gap-1 text-sm">
            {sections.map((section) => (
              <li key={section.assetPath} className="flex items-baseline justify-between gap-3 border-b border-divider/60 py-1">
                <Mono>{section.assetPath}</Mono>
                <span className="shrink-0 text-xs text-channel">{formatNumber(section.recordCount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </SettingsPage>
  );
}
