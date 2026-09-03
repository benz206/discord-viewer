"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ChannelKind } from "@/components/layout/channel-icon";
import {
  emojiUrl,
  formatDiscordTimestamp,
  isEmojiOnly,
  parseDiscordMarkdown,
  type ListItemNode,
  type MarkdownNode,
} from "@/components/messages/markdown";

export type MentionInfo = {
  name: string;
  color?: string | null;
  href?: string;
};

export type MarkdownResolvers = {
  resolveUser?: (id: string) => MentionInfo | null | undefined;
  resolveChannel?: (
    id: string,
  ) => (MentionInfo & { kind?: ChannelKind }) | null | undefined;
  resolveRole?: (id: string) => MentionInfo | null | undefined;
  resolveEmoji?: (id: string, name: string) => string | null | undefined;
};

export type MessageContentProps = {
  content: string;
  resolvers?: MarkdownResolvers;
  extended?: boolean;
  allowJumbo?: boolean;
  trailing?: React.ReactNode;
  className?: string;
};

type RenderContext = {
  resolvers?: MarkdownResolvers;
  jumbo: boolean;
};

function childrenOf(node: MarkdownNode): MarkdownNode[] {
  const content = node.content;
  if (Array.isArray(content)) return content;
  if (typeof content === "string") return [{ type: "text", content }];
  return [];
}

function trimTrailingBreaks(nodes: MarkdownNode[]) {
  let end = nodes.length;
  while (end > 0 && (nodes[end - 1].type === "br" || nodes[end - 1].type === "newline")) {
    end -= 1;
  }
  return nodes.slice(0, end);
}

function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={revealed ? undefined : "Reveal spoiler"}
      onClick={() => setRevealed(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setRevealed(true);
        }
      }}
      className={cn(
        "rounded-[4px] outline-none",
        revealed
          ? "bg-spoiler-revealed"
          : "cursor-pointer bg-spoiler text-transparent select-none [&_*]:invisible",
      )}
    >
      {children}
    </span>
  );
}

function CustomEmoji({
  id,
  name,
  animated,
  jumbo,
  resolvers,
}: {
  id: string;
  name: string;
  animated?: boolean;
  jumbo: boolean;
  resolvers?: MarkdownResolvers;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolvers?.resolveEmoji?.(id, name) ?? emojiUrl(id, animated);

  if (failed) {
    return <span className="text-channel">:{name}:</span>;
  }

  return (
    <img
      src={src}
      alt={`:${name}:`}
      title={`:${name}:`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "inline-block object-contain align-bottom",
        jumbo ? "size-12" : "size-[22px]",
      )}
    />
  );
}

function MentionPill({
  label,
  color,
  href,
  title,
}: {
  label: string;
  color?: string | null;
  href?: string;
  title?: string;
}) {
  const className = cn(
    "rounded-[3px] px-0.5 font-medium transition-colors",
    color
      ? "hover:brightness-125"
      : "bg-mention text-mention-fg hover:bg-mention-hover hover:text-white",
    href && "cursor-pointer",
  );
  const style = color
    ? { color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }
    : undefined;

  if (href) {
    return (
      <a href={href} title={title} className={className} style={style}>
        {label}
      </a>
    );
  }
  return (
    <span title={title} className={className} style={style}>
      {label}
    </span>
  );
}

function TimestampPill({
  seconds,
  format,
}: {
  seconds: number;
  format?: string;
}) {
  return (
    <span
      suppressHydrationWarning
      title={formatDiscordTimestamp(seconds, "F")}
      className="rounded-[3px] bg-mention px-0.5 text-normal"
    >
      {formatDiscordTimestamp(seconds, format ?? "f")}
    </span>
  );
}

function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  return (
    <div className="my-1 overflow-hidden rounded border border-code-border bg-code">
      {lang ? (
        <div className="border-b border-code-border px-3 py-1 font-mono text-[11px] text-channel lowercase">
          {lang}
        </div>
      ) : null}
      <pre className="scrollbar-discord overflow-x-auto px-3 py-2">
        <code className="font-mono text-[0.875rem] leading-[1.125rem] break-words whitespace-pre-wrap text-subhead">
          {code}
        </code>
      </pre>
    </div>
  );
}

function ListNode({ node, ctx }: { node: MarkdownNode; ctx: RenderContext }) {
  const items = (node.items ?? []) as ListItemNode[];
  const ordered = Boolean(node.ordered);
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag
      start={ordered ? (node.start as number) : undefined}
      className={cn(
        "my-1 ml-4 space-y-0.5",
        ordered ? "list-decimal" : "list-disc",
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="marker:text-channel">
          {renderNodes(item.content, ctx)}
          {item.children.map((child, childIndex) => (
            <ListNode key={childIndex} node={child} ctx={ctx} />
          ))}
        </li>
      ))}
    </Tag>
  );
}

function renderNodes(nodes: MarkdownNode[], ctx: RenderContext) {
  return nodes.map((node, index) => (
    <RenderNode key={index} node={node} ctx={ctx} />
  ));
}

function RenderNode({
  node,
  ctx,
}: {
  node: MarkdownNode;
  ctx: RenderContext;
}) {
  switch (node.type) {
    case "text":
      return <>{node.content as string}</>;

    case "br":
    case "newline":
      return <br />;

    case "em":
      return <em>{renderNodes(childrenOf(node), ctx)}</em>;

    case "strong":
      return <strong className="font-bold">{renderNodes(childrenOf(node), ctx)}</strong>;

    case "underline":
      return <u>{renderNodes(childrenOf(node), ctx)}</u>;

    case "strikethrough":
      return <s>{renderNodes(childrenOf(node), ctx)}</s>;

    case "inlineCode":
      return (
        <code className="rounded-[3px] bg-code px-[0.3em] py-[0.15em] font-mono text-[0.85em] whitespace-break-spaces text-subhead">
          {node.content as string}
        </code>
      );

    case "codeBlock":
      return (
        <CodeBlock
          lang={(node.lang as string) || undefined}
          code={node.content as string}
        />
      );

    case "blockQuote":
      return (
        <blockquote className="my-0.5 flex gap-2">
          <span
            aria-hidden
            className="w-1 shrink-0 rounded-full bg-quote-bar"
          />
          <span className="min-w-0 flex-1 text-normal">
            {renderNodes(trimTrailingBreaks(childrenOf(node)), ctx)}
          </span>
        </blockquote>
      );

    case "spoiler":
      return <Spoiler>{renderNodes(childrenOf(node), ctx)}</Spoiler>;

    case "heading": {
      const level = (node.level as number) ?? 1;
      const sizes = ["text-2xl", "text-xl", "text-base"];
      const Tag = (["h1", "h2", "h3"] as const)[Math.min(level, 3) - 1];
      return (
        <Tag
          className={cn(
            "mt-2 mb-1 font-bold text-header first:mt-0",
            sizes[Math.min(level, 3) - 1],
          )}
        >
          {renderNodes(childrenOf(node), ctx)}
        </Tag>
      );
    }

    case "subtext":
      return (
        <div className="mt-0.5 text-xs leading-4 text-channel">
          {renderNodes(childrenOf(node), ctx)}
        </div>
      );

    case "list":
      return <ListNode node={node} ctx={ctx} />;

    case "url":
    case "autolink":
    case "link":
      return (
        <a
          href={node.target as string}
          target="_blank"
          rel="noreferrer noopener"
          className="text-link hover:underline"
        >
          {renderNodes(childrenOf(node), ctx)}
        </a>
      );

    case "user": {
      const id = node.id as string;
      const info = ctx.resolvers?.resolveUser?.(id);
      return (
        <MentionPill
          label={`@${info?.name ?? id}`}
          color={info?.color}
          href={info?.href}
          title={id}
        />
      );
    }

    case "role": {
      const id = node.id as string;
      const info = ctx.resolvers?.resolveRole?.(id);
      return (
        <MentionPill
          label={`@${info?.name ?? `role:${id}`}`}
          color={info?.color}
          href={info?.href}
          title={id}
        />
      );
    }

    case "channel": {
      const id = node.id as string;
      const info = ctx.resolvers?.resolveChannel?.(id);
      return (
        <MentionPill
          label={`#${info?.name ?? id}`}
          href={info?.href}
          title={id}
        />
      );
    }

    case "everyone":
      return <MentionPill label="@everyone" />;

    case "here":
      return <MentionPill label="@here" />;

    case "emoji":
      return (
        <CustomEmoji
          id={node.id as string}
          name={node.name as string}
          animated={node.animated as boolean}
          jumbo={ctx.jumbo}
          resolvers={ctx.resolvers}
        />
      );

    case "twemoji":
      return (
        <span
          className={cn(
            "inline-block align-bottom",
            ctx.jumbo ? "text-[2.75rem] leading-[3rem]" : "text-[1.375em]",
          )}
        >
          {node.name as string}
        </span>
      );

    case "timestamp":
      return (
        <TimestampPill
          seconds={Number(node.timestamp)}
          format={node.format as string | undefined}
        />
      );

    case "slashCommand":
      return <MentionPill label={`/${node.fullName as string}`} />;

    case "guildNavigation":
      return <MentionPill label={`#${node.navigation as string}`} />;

    default:
      return <>{renderNodes(childrenOf(node), ctx)}</>;
  }
}

export function MessageContent({
  content,
  resolvers,
  extended = true,
  allowJumbo = true,
  trailing,
  className,
}: MessageContentProps) {
  if (!content) return trailing ?? null;

  const nodes = parseDiscordMarkdown(content, extended);
  const jumbo = allowJumbo && isEmojiOnly(nodes) > 0;

  return (
    <div
      className={cn(
        "text-[1rem] leading-[1.375rem] break-words whitespace-pre-wrap text-normal",
        className,
      )}
    >
      {renderNodes(nodes, { resolvers, jumbo })}
      {trailing}
    </div>
  );
}
