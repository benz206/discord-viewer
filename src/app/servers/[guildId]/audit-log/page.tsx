import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ScrollText } from "lucide-react";

import { getGuild } from "@/lib/data/servers";
import { auditLogActionName, type AuditLogChange } from "@/lib/data/types";
import { EmptyState } from "@/components/common/empty-state";
import { DefinitionList, ScalarValue } from "@/components/servers/definition-list";
import { formatDateTime, roleColor, snowflakeDate } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { RawDetails } from "@/components/servers/raw-details";
import { UserRef } from "@/components/users/user-ref";

const PAGE_SIZE = 100;

function isRoleList(value: unknown): value is Array<{ id: string; name: string }> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "object" && item !== null && "id" in item && "name" in item)
  );
}

function ChangeValue({
  value,
  present,
  tone,
  roles,
}: {
  value: unknown;
  present: boolean;
  tone: "old" | "new" | "removed";
  roles: Record<string, { color: number }>;
}) {
  const base =
    tone === "old"
      ? "bg-danger/10 text-danger line-through decoration-danger/40"
      : tone === "removed"
        ? "bg-danger/10 text-danger"
        : "bg-positive/10 text-positive";

  if (!present) {
    return <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[12px] text-faint">not recorded</span>;
  }

  if (isRoleList(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((role) => {
          const color = roleColor(roles[role.id]?.color);
          return (
            <span
              key={role.id}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] ${base}`}
              title={role.id}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: color ?? "#99aab5" }} />
              {role.name}
            </span>
          );
        })}
      </span>
    );
  }

  const text =
    value === null
      ? "null"
      : typeof value === "string"
        ? value || "(empty string)"
        : JSON.stringify(value);

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[12px] break-all ${base}`}>{text}</span>
  );
}

function ChangeRow({
  change,
  roles,
}: {
  change: AuditLogChange;
  roles: Record<string, { color: number }>;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2 py-1">
      <span className="min-w-28 shrink-0 font-mono text-[12px] text-mention-fg">{change.key}</span>
      <ChangeValue value={change.old_value} present={"old_value" in change} tone="old" roles={roles} />
      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-faint" />
      <ChangeValue
        value={change.new_value}
        present={"new_value" in change}
        tone={change.key === "$remove" ? "removed" : "new"}
        roles={roles}
      />
    </div>
  );
}

export default async function GuildAuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { guildId } = await params;
  const { page } = await searchParams;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const entries = guild.auditLog;
  if (!entries) {
    return (
      <>
        <PageHeader icon={<ScrollText />} title="Audit Log" subtitle={guild.name} />
        <MissingFile file="audit-log.json" what="audit log" />
      </>
    );
  }

  const roles = guild.guild?.roles ?? {};
  const sorted = [...entries].sort((a, b) => (a.id < b.id ? 1 : -1));
  const pageIndex = Math.max(0, Number(page ?? "0") || 0);
  const start = pageIndex * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  return (
    <>
      <PageHeader icon={<ScrollText />} title="Audit Log" subtitle={`${guild.name} · ${entries.length} entries`} />
      {entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText />}
          title="Audit log is empty"
          description="audit-log.json exists for this server but contains no entries."
        />
      ) : (
        <PageBody>
          <Section
            title={`Entries ${start + 1}–${start + visible.length} of ${sorted.length}`}
            description="Newest first. Discord only exports the actions you performed."
          >
            <div className="space-y-3">
              {visible.map((entry) => {
                const record = entry as unknown as Record<string, unknown>;
                return (
                  <div key={entry.id} className="rounded-lg bg-surface-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="brand" title={`action_type ${entry.action_type}`}>
                        {auditLogActionName(entry.action_type)}
                      </Pill>
                      <UserRef id={entry.user_id} size={18} />
                      {entry.target_id ? (
                        <>
                          <span className="text-xs text-channel">on</span>
                          <UserRef id={entry.target_id} size={18} />
                        </>
                      ) : null}
                      <span className="ml-auto shrink-0 text-xs text-channel">
                        {formatDateTime(snowflakeDate(entry.id))}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-faint">{entry.id}</div>

                    {entry.reason ? (
                      <p className="mt-1.5 text-sm text-channel">Reason: {entry.reason}</p>
                    ) : null}

                    <div className="mt-2 border-t border-divider pt-2">
                      {(entry.changes ?? []).length === 0 ? (
                        <p className="text-xs text-faint">No changes recorded.</p>
                      ) : (
                        (entry.changes ?? []).map((change, index) => (
                          <ChangeRow key={`${change.key}-${index}`} change={change} roles={roles} />
                        ))
                      )}
                    </div>

                    {entry.options ? (
                      <DefinitionList
                        className="mt-2 bg-surface-3/60"
                        fields={Object.keys(entry.options).map((key) => ({
                          key,
                          label: key,
                          value: <ScalarValue value={entry.options?.[key]} />,
                        }))}
                      />
                    ) : null}

                    <details className="mt-2">
                      <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
                        All {Object.keys(record).length} fields
                      </summary>
                      <DefinitionList
                        className="mt-2 bg-surface-3/60"
                        fields={Object.keys(record).map((key) => ({
                          key,
                          label: key,
                          value: <ScalarValue value={record[key]} />,
                        }))}
                      />
                    </details>
                  </div>
                );
              })}
            </div>

            {pageCount > 1 ? (
              <div className="mt-4 flex items-center justify-between text-sm">
                {pageIndex > 0 ? (
                  <Link href={`?page=${pageIndex - 1}`} className="text-link hover:underline">
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-channel">
                  Page {pageIndex + 1} of {pageCount}
                </span>
                {pageIndex + 1 < pageCount ? (
                  <Link href={`?page=${pageIndex + 1}`} className="text-link hover:underline">
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            ) : null}

            <RawDetails value={entries} name="audit-log.json" />
          </Section>
        </PageBody>
      )}
    </>
  );
}
