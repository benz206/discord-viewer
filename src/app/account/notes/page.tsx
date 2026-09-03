import Link from "next/link";
import { notFound } from "next/navigation";

import { getUser } from "@/lib/data/meta";
import { getUserNotes } from "@/lib/data/users";
import { EmptyState } from "@/components/common/empty-state";
import { JsonViewer } from "@/components/common/json-viewer";
import { Card, Mono, Section, SettingsPage } from "@/components/account/section";
import { asRecord } from "@/components/account/format";

export default function NotesPage() {
  const user = getUser();
  if (!user) notFound();

  const notes = getUserNotes();
  const raw = asRecord(user.notes);

  return (
    <SettingsPage
      title="Notes"
      description="Private notes this account wrote about other users. Names resolve from the indexed user directory."
    >
      {notes.length === 0 ? <EmptyState title="No notes" description="notes is empty." /> : null}

      <Section title="Notes" count={notes.length}>
        <Card className="flex flex-col gap-0 p-0">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/users/${note.id}`}
              className="flex flex-col gap-1 border-b border-divider px-4 py-3 last:border-0 hover:bg-hover"
            >
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-header">{note.name ?? "Unknown user"}</span>
                <Mono className="text-[11px] text-faint">{note.id}</Mono>
              </span>
              <span className="text-sm whitespace-pre-wrap text-normal">{note.note}</span>
            </Link>
          ))}
        </Card>
      </Section>

      <Section title="Raw notes" count={Object.keys(raw).length}>
        <JsonViewer value={user.notes} name="notes" defaultExpandedDepth={1} className="max-h-[28rem]" />
      </Section>
    </SettingsPage>
  );
}
