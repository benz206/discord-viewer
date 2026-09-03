import { notFound } from "next/navigation";
import { Monitor, Smartphone } from "lucide-react";

import { getUser } from "@/lib/data/meta";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BoolValue, Card, Mono, Section, SettingsPage } from "@/components/account/section";
import { asRecord, asRecords, formatDateTime } from "@/components/account/format";

const MOBILE = /android|ios|iphone|ipad/i;

export default function SessionsPage() {
  const user = getUser();
  if (!user) notFound();

  const sessions = asRecords(user.user_sessions);

  return (
    <SettingsPage
      title="Sessions"
      description="Authenticated sessions recorded at export time, with every field of user_sessions."
    >
      {sessions.length === 0 ? <EmptyState title="No sessions" description="user_sessions is empty." /> : null}

      {sessions.length > 0 ? (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-divider">
                <TableHead className="text-channel">Client</TableHead>
                <TableHead className="text-channel">OS</TableHead>
                <TableHead className="text-channel">IP</TableHead>
                <TableHead className="text-channel">MFA</TableHead>
                <TableHead className="text-channel">Bot</TableHead>
                <TableHead className="text-channel">Version</TableHead>
                <TableHead className="text-channel">Created</TableHead>
                <TableHead className="text-channel">Last used</TableHead>
                <TableHead className="text-channel">Expires</TableHead>
                <TableHead className="text-channel">Extra tokens</TableHead>
                <TableHead className="text-channel">Soft deleted</TableHead>
                <TableHead className="text-channel">ID hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => {
                const data = asRecord(session.user_data);
                const client = asRecord(data.client_info);
                const os = String(client.os ?? "—");
                const Icon = MOBILE.test(os) ? Smartphone : Monitor;
                return (
                  <TableRow key={String(session.id_hash ?? index)} className="border-divider">
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-medium text-header">
                        <Icon className="size-4 text-channel" />
                        {String(client.platform ?? "Unknown")}
                      </span>
                    </TableCell>
                    <TableCell>{os}</TableCell>
                    <TableCell>
                      <Mono>{String(client.ip ?? "—")}</Mono>
                    </TableCell>
                    <TableCell>
                      <BoolValue value={Boolean(data.is_mfa)} />
                    </TableCell>
                    <TableCell>
                      <BoolValue value={Boolean(data.is_bot)} />
                    </TableCell>
                    <TableCell>
                      <Mono>{String(data.version ?? "—")}</Mono>
                    </TableCell>
                    <TableCell>{formatDateTime(data.creation_time)}</TableCell>
                    <TableCell>{formatDateTime(data.approx_last_used_time)}</TableCell>
                    <TableCell>{formatDateTime(data.expiration_time)}</TableCell>
                    <TableCell>
                      {data.extra_tokens === null || data.extra_tokens === undefined ? (
                        <span className="text-faint">null</span>
                      ) : (
                        <Mono>{JSON.stringify(data.extra_tokens)}</Mono>
                      )}
                    </TableCell>
                    <TableCell>
                      <BoolValue value={Boolean(session.is_soft_deleted)} />
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      <Mono className="line-clamp-1">{String(session.id_hash ?? "—")}</Mono>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <Section title="Raw user_sessions" count={sessions.length}>
        <JsonViewer
          value={user.user_sessions}
          name="user_sessions"
          defaultExpandedDepth={0}
          className="max-h-[28rem]"
        />
      </Section>
    </SettingsPage>
  );
}
