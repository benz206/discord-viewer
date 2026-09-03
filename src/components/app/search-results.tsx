import Link from "next/link";
import { Paperclip } from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { ChannelIcon, type ChannelKind } from "@/components/layout/channel-icon";
import { formatDateTime } from "@/components/app/format";

export type SearchResultItem = {
  id: string;
  href: string;
  ts: number;
  snippet: string;
  channelName: string;
  channelKind: ChannelKind;
  guildName: string | null;
  attachmentCount: number;
};

function parseSnippet(text: string): Array<{ text: string; marked: boolean }> {
  const segments: Array<{ text: string; marked: boolean }> = [];
  let marked = false;
  for (const part of text.split(/(<mark>|<\/mark>)/)) {
    if (part === "<mark>") marked = true;
    else if (part === "</mark>") marked = false;
    else if (part) segments.push({ text: part, marked });
  }
  return segments;
}

function Snippet({ text }: { text: string }) {
  return (
    <>
      {parseSnippet(text).map((segment, index) =>
        segment.marked ? (
          <mark key={index} className="rounded-[3px] bg-mention px-0.5 text-mention-fg">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

export function SearchResultRow({
  item,
  author,
}: {
  item: SearchResultItem;
  author: { id: string; name: string; avatarUrl: string | null };
}) {
  return (
    <Link
      href={item.href}
      className="group flex gap-3 rounded-lg bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-alt"
    >
      <Avatar
        size={40}
        id={author.id}
        name={author.name}
        src={author.avatarUrl}
        ringColor="var(--color-surface-2)"
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-header">{author.name}</span>
          <span className="text-xs text-channel">{formatDateTime(item.ts)}</span>
          <span className="ml-auto flex min-w-0 items-center gap-1 text-xs text-channel">
            {item.guildName ? (
              <span className="truncate">{item.guildName}</span>
            ) : null}
            <ChannelIcon kind={item.channelKind} className="size-3.5" />
            <span className="max-w-40 truncate group-hover:text-interactive-hover">
              {item.channelName}
            </span>
          </span>
        </div>
        <p className="mt-0.5 text-[0.95rem] leading-[1.35rem] break-words text-normal">
          <Snippet text={item.snippet} />
        </p>
        {item.attachmentCount > 0 ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-channel">
            <Paperclip className="size-3" />
            {item.attachmentCount} attachment{item.attachmentCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
