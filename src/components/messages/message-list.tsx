"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { dayKey, formatDateDivider, toDate } from "@/components/messages/markdown";
import type { MarkdownResolvers } from "@/components/messages/message-content";
import {
  MessageRow,
  type ChatMessage,
  type MessageAuthor,
} from "@/components/messages/message-row";

export type MessageListProps = {
  messages: ChatMessage[];
  groupWindowMs?: number;
  resolvers?: MarkdownResolvers;
  header?: React.ReactNode;
  empty?: React.ReactNode;
  footer?: React.ReactNode;
  onAuthorClick?: (author: MessageAuthor) => void;
  className?: string;
};

type MessageBlock = {
  key: string;
  divider: string | null;
  messages: ChatMessage[];
};

function buildBlocks(messages: ChatMessage[], windowMs: number) {
  const blocks: MessageBlock[] = [];
  let previous: ChatMessage | null = null;

  for (const message of messages) {
    const newDay = !previous || dayKey(previous.timestamp) !== dayKey(message.timestamp);
    const sameAuthor = previous?.author.id === message.author.id;
    const withinWindow =
      previous !== null &&
      Math.abs(
        toDate(message.timestamp).getTime() -
          toDate(previous.timestamp).getTime(),
      ) <= windowMs;
    const grouped =
      !newDay && sameAuthor && withinWindow && !message.reply && !previous?.pinned;

    if (grouped && blocks.length > 0) {
      blocks[blocks.length - 1].messages.push(message);
    } else {
      blocks.push({
        key: message.id,
        divider: newDay ? formatDateDivider(message.timestamp) : null,
        messages: [message],
      });
    }
    previous = message;
  }

  return blocks;
}

export function MessageList({
  messages,
  groupWindowMs = 7 * 60 * 1000,
  resolvers,
  header,
  empty,
  footer,
  onAuthorClick,
  className,
}: MessageListProps) {
  const blocks = useMemo(
    () => buildBlocks(messages, groupWindowMs),
    [messages, groupWindowMs],
  );

  return (
    <div
      className={cn(
        "scrollbar-discord flex min-h-0 flex-1 flex-col overflow-y-auto",
        className,
      )}
    >
      {header}
      {blocks.length === 0 ? empty : null}
      <div className="pb-6">
        {blocks.map((block) => (
          <div key={block.key} className="contain-block">
            {block.divider ? (
              <div
                className="mt-6 mb-2 flex items-center px-4"
                role="separator"
                aria-label={block.divider}
              >
                <span className="h-px flex-1 bg-divider" />
                <span
                  suppressHydrationWarning
                  className="px-2 text-xs font-semibold text-channel"
                >
                  {block.divider}
                </span>
                <span className="h-px flex-1 bg-divider" />
              </div>
            ) : null}
            {block.messages.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                compact={index > 0}
                resolvers={resolvers}
                onAuthorClick={onAuthorClick}
              />
            ))}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
