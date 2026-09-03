"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Pencil, Pin, Reply, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";
import {
  Attachment,
  type AttachmentInfo,
} from "@/components/messages/attachment";
import {
  MessageContent,
  type MarkdownResolvers,
} from "@/components/messages/message-content";
import {
  emojiUrl,
  formatClockTime,
  formatFullTime,
  formatMessageTime,
} from "@/components/messages/markdown";

export type MessageAuthor = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  color?: string | null;
  bot?: boolean;
};

export type MessageReaction = {
  name: string;
  count: number;
  id?: string | null;
  animated?: boolean;
  me?: boolean;
};

export type ChatMessage = {
  id: string;
  author: MessageAuthor;
  timestamp: string | number | Date;
  content?: string | null;
  attachments?: (AttachmentInfo | string)[];
  editedTimestamp?: string | number | Date | null;
  pinned?: boolean;
  reply?: {
    id?: string;
    author: MessageAuthor;
    content?: string | null;
  } | null;
  reactions?: MessageReaction[];
};

export type MessageRowProps = {
  message: ChatMessage;
  compact?: boolean;
  resolvers?: MarkdownResolvers;
  onAuthorClick?: (author: MessageAuthor) => void;
  className?: string;
};

function AuthorName({
  author,
  onAuthorClick,
  className,
}: {
  author: MessageAuthor;
  onAuthorClick?: (author: MessageAuthor) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onAuthorClick ? () => onAuthorClick(author) : undefined}
      className={cn(
        "font-medium text-header hover:underline",
        !onAuthorClick && "cursor-default hover:no-underline",
        className,
      )}
      style={author.color ? { color: author.color } : undefined}
    >
      {author.name}
    </button>
  );
}

const actionClass =
  "flex size-7 items-center justify-center text-interactive transition-colors hover:bg-hover hover:text-interactive-hover [&_svg]:size-4";

function MessageActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="absolute -top-3 right-4 z-10 hidden items-center overflow-hidden rounded border border-divider bg-surface-2 shadow-md group-focus-within:flex group-hover:flex">
      <Link
        href={`/activity?messageId=${id}`}
        aria-label="Activity events for this message"
        title="Activity events"
        className={actionClass}
      >
        <Waypoints />
      </Link>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(id).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            },
            () => undefined,
          );
        }}
        aria-label="Copy message ID"
        title={copied ? "Copied" : `Copy ID ${id}`}
        className={actionClass}
      >
        {copied ? <Check className="text-positive" /> : <Copy />}
      </button>
    </div>
  );
}

function BotTag() {
  return (
    <span className="rounded bg-brand px-1 py-px text-[10px] leading-[14px] font-medium text-white uppercase">
      Bot
    </span>
  );
}

function ReactionEmoji({ reaction }: { reaction: MessageReaction }) {
  const [failed, setFailed] = useState(false);

  if (!reaction.id || failed) {
    return <span>{reaction.id ? `:${reaction.name}:` : reaction.name}</span>;
  }

  return (
    <img
      src={emojiUrl(reaction.id, reaction.animated, 24)}
      alt={`:${reaction.name}:`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-4"
    />
  );
}

function Reactions({ reactions }: { reactions: MessageReaction[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((reaction, index) => (
        <span
          key={`${reaction.name}-${index}`}
          title={`:${reaction.name}:`}
          className={cn(
            "flex h-6 items-center gap-1 rounded-lg border px-1.5 text-sm",
            reaction.me
              ? "border-brand bg-mention text-mention-fg"
              : "border-transparent bg-hover text-subhead",
          )}
        >
          <ReactionEmoji reaction={reaction} />
          <span className="text-xs font-semibold tabular-nums">
            {reaction.count}
          </span>
        </span>
      ))}
    </div>
  );
}

function ReplyPreview({
  reply,
  resolvers,
}: {
  reply: NonNullable<ChatMessage["reply"]>;
  resolvers?: MarkdownResolvers;
}) {
  return (
    <div className="mb-0.5 flex items-center gap-1.5 overflow-hidden text-sm text-channel">
      <Reply className="size-3.5 shrink-0 -scale-y-100" />
      <Avatar
        src={reply.author.avatarUrl}
        name={reply.author.name}
        id={reply.author.id}
        size={16}
      />
      <span
        className="shrink-0 font-medium text-header"
        style={reply.author.color ? { color: reply.author.color } : undefined}
      >
        {reply.author.name}
      </span>
      <span className="min-w-0 flex-1 truncate opacity-80">
        <MessageContent
          content={reply.content ?? ""}
          resolvers={resolvers}
          allowJumbo={false}
          className="inline text-sm leading-none whitespace-nowrap"
        />
      </span>
    </div>
  );
}

function MessageRowImpl({
  message,
  compact = false,
  resolvers,
  onAuthorClick,
  className,
}: MessageRowProps) {
  const full = formatFullTime(message.timestamp);
  const attachments = message.attachments ?? [];

  return (
    <article
      className={cn(
        "group relative flex gap-4 px-4 py-0.5 hover:bg-msg-hover",
        compact ? "min-h-[22px]" : "mt-4 pt-0.5",
        message.pinned && "bg-[rgba(240,178,50,0.05)]",
        className,
      )}
    >
      <MessageActions id={message.id} />

      {compact ? (
        <>
          <time
            suppressHydrationWarning
            dateTime={String(message.timestamp)}
            title={full}
            className="absolute left-0 w-[72px] pt-px pr-4 text-right text-[0.6875rem] leading-[1.375rem] whitespace-nowrap text-channel opacity-0 group-hover:opacity-100"
          >
            {formatClockTime(message.timestamp)}
          </time>
          <span aria-hidden className="w-10 shrink-0" />
        </>
      ) : (
        <button
          type="button"
          onClick={
            onAuthorClick ? () => onAuthorClick(message.author) : undefined
          }
          aria-label={message.author.name}
          className={cn(
            "mt-0.5 shrink-0 self-start",
            !onAuthorClick && "cursor-default",
          )}
        >
          <Avatar
            src={message.author.avatarUrl}
            name={message.author.name}
            id={message.author.id}
            size={40}
          />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {message.reply ? (
          <ReplyPreview reply={message.reply} resolvers={resolvers} />
        ) : null}

        {compact ? null : (
          <div className="flex items-center gap-2">
            <AuthorName author={message.author} onAuthorClick={onAuthorClick} />
            {message.author.bot ? <BotTag /> : null}
            <time
              suppressHydrationWarning
              dateTime={String(message.timestamp)}
              title={full}
              className="text-xs leading-[1.375rem] text-channel"
            >
              {formatMessageTime(message.timestamp)}
            </time>
            {message.pinned ? (
              <Pin className="size-3 text-warning" aria-label="Pinned" />
            ) : null}
          </div>
        )}

        <MessageContent
          content={message.content ?? ""}
          resolvers={resolvers}
          trailing={
            message.editedTimestamp ? (
              <span
                suppressHydrationWarning
                title={formatFullTime(message.editedTimestamp)}
                className="ml-1 inline-flex translate-y-px items-center gap-0.5 text-[0.625rem] text-channel"
              >
                <Pencil className="size-2.5" />
                edited
              </span>
            ) : null
          }
        />

        {attachments.length > 0 ? (
          <div className="mt-1 flex flex-col gap-2">
            {attachments.map((attachment, index) => (
              <Attachment
                key={
                  typeof attachment === "string"
                    ? `${attachment}-${index}`
                    : `${attachment.url}-${index}`
                }
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}

        {message.reactions?.length ? (
          <Reactions reactions={message.reactions} />
        ) : null}
      </div>
    </article>
  );
}

export const MessageRow = memo(MessageRowImpl);
