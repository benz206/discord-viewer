import { Download, LifeBuoy } from "lucide-react";

import { getSupportTickets } from "@/lib/data/package-extras";
import { EmptyState } from "@/components/common/empty-state";
import { Card, Mono, Pill, Section, SettingsPage } from "@/components/account/section";
import { formatDateTime, formatNumber } from "@/components/account/format";

function statusTone(status: string | null): "positive" | "danger" | "neutral" {
  if (status === "solved" || status === "closed") return "positive";
  if (status === "deleted") return "danger";
  return "neutral";
}

export default function SupportTicketsPage() {
  const { tickets, assetPath } = getSupportTickets();

  if (tickets.length === 0) {
    return (
      <SettingsPage title="Support Tickets" description="Help Center tickets tied to this account's email address.">
        <Card className="p-0">
          <EmptyState
            icon={<LifeBuoy />}
            title="No support tickets"
            description="This package has no Support_Tickets/ folder, or it contains no tickets."
          />
        </Card>
      </SettingsPage>
    );
  }

  const commentCount = tickets.reduce((sum, ticket) => sum + ticket.comments.length, 0);

  return (
    <SettingsPage
      title="Support Tickets"
      description={`${formatNumber(tickets.length)} Help Center tickets tied to this account's email address, with ${formatNumber(commentCount)} messages between you and Discord support.`}
      action={
        assetPath ? (
          <a
            href={`/api/asset/${assetPath}`}
            download
            className="inline-flex items-center gap-1.5 rounded bg-surface-2 px-2.5 py-1.5 text-sm text-interactive hover:bg-hover hover:text-interactive-hover"
          >
            <Download className="size-4" /> tickets.json
          </a>
        ) : null
      }
    >
      {tickets.map((ticket) => (
        <Section key={ticket.id} title={ticket.subject ?? `Ticket ${ticket.id}`} count={ticket.comments.length}>
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Mono>#{ticket.id}</Mono>
              <Pill tone={statusTone(ticket.status)}>{ticket.status ?? "unknown"}</Pill>
              <span className="text-xs text-channel">{formatDateTime(ticket.createdAt)}</span>
            </div>

            {ticket.comments.length === 0 ? (
              <p className="text-sm text-faint">This ticket has no messages.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {ticket.comments.map((comment, index) => (
                  <li key={index} className="rounded-md bg-surface-3 p-3">
                    <div className="flex flex-wrap items-baseline gap-2 pb-1.5">
                      <span className="text-sm font-semibold text-header">{comment.author ?? "Unknown"}</span>
                      <span className="text-xs text-channel">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap text-normal">{comment.comment}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </Section>
      ))}
    </SettingsPage>
  );
}
