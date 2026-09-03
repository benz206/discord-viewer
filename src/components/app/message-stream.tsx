"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  makeResolvers,
  mergeResolverMaps,
  type ResolverMap,
} from "@/lib/resolvers-client";
import { MessageList } from "@/components/messages/message-list";
import type { ChatMessage, MessageAuthor } from "@/components/messages/message-row";

export type StreamMessage = {
  id: string;
  ts: number;
  contents: string;
  attachments: string[];
  cursor: string;
};

export type MessageStreamProps = {
  channelId: string;
  author: MessageAuthor;
  initialMessages: StreamMessage[];
  initialResolvers: ResolverMap;
  initialHasOlder: boolean;
  initialHasNewer: boolean;
  highlightId?: string | null;
  intro?: React.ReactNode;
  empty?: React.ReactNode;
};

type Direction = "older" | "newer";

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-channel">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function MessageStream({
  channelId,
  author,
  initialMessages,
  initialResolvers,
  initialHasOlder,
  initialHasNewer,
  highlightId,
  intro,
  empty,
}: MessageStreamProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [resolverMap, setResolverMap] = useState(initialResolvers);
  const [hasOlder, setHasOlder] = useState(initialHasOlder);
  const [hasNewer, setHasNewer] = useState(initialHasNewer);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const anchor = useRef<{ selector: string; offset: number } | null>(null);
  const state = useRef({ messages, hasOlder, hasNewer });

  useEffect(() => {
    state.current = { messages, hasOlder, hasNewer };
  }, [messages, hasOlder, hasNewer]);

  const scroller = useCallback(
    () => topRef.current?.closest<HTMLElement>(".message-scroller") ?? null,
    [],
  );

  const rowSelector = (ts: number) => `time[datetime="${new Date(ts).toISOString()}"]`;

  const rowOffset = (root: HTMLElement, selector: string) => {
    const row = root.querySelector(selector)?.closest("article");
    if (!row) return null;
    return row.getBoundingClientRect().top - root.getBoundingClientRect().top;
  };

  const load = useCallback(
    async (direction: Direction) => {
      const current = state.current;
      if (busy.current) return;
      if (direction === "older" ? !current.hasOlder : !current.hasNewer) return;

      const anchorMessage =
        direction === "older"
          ? current.messages[0]
          : current.messages[current.messages.length - 1];
      if (!anchorMessage) return;

      busy.current = true;
      const element = scroller();
      if (direction === "older" && element) {
        const selector = rowSelector(anchorMessage.ts);
        const offset = rowOffset(element, selector);
        anchor.current = offset === null ? null : { selector, offset };
      }

      try {
        const query = new URLSearchParams({
          [direction === "older" ? "before" : "after"]: anchorMessage.cursor,
          limit: "50",
        });
        const response = await fetch(`/api/channels/${channelId}/messages?${query}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const page = (await response.json()) as {
          messages: StreamMessage[];
          hasMore: boolean;
          resolvers: ResolverMap;
        };

        setResolverMap((previous) => mergeResolverMaps(previous, page.resolvers));
        setMessages((previous) =>
          direction === "older"
            ? [...page.messages, ...previous]
            : [...previous, ...page.messages],
        );
        if (direction === "older") setHasOlder(page.hasMore);
        else setHasNewer(page.hasMore);
      } catch {
        anchor.current = null;
        if (direction === "older") setHasOlder(false);
        else setHasNewer(false);
      } finally {
        busy.current = false;
      }
    },
    [channelId, scroller],
  );

  useLayoutEffect(() => {
    const pending = anchor.current;
    anchor.current = null;
    if (!pending) return;
    const element = scroller();
    if (!element) return;
    const offset = rowOffset(element, pending.selector);
    if (offset !== null) element.scrollTop += offset - pending.offset;
  }, [messages, scroller]);

  useEffect(() => {
    const element = scroller();
    if (!element) return;

    if (highlightId) {
      const target = initialMessages.find((message) => message.id === highlightId);
      const node = target
        ? element.querySelector<HTMLElement>(
            `time[datetime="${new Date(target.ts).toISOString()}"]`,
          )
        : null;
      const article = node?.closest<HTMLElement>("article");
      if (article) {
        article.scrollIntoView({ block: "center" });
        article.style.transition = "background-color 1.2s ease-out";
        article.style.backgroundColor = "rgba(250, 168, 26, 0.14)";
        const timer = setTimeout(() => {
          article.style.backgroundColor = "";
        }, 2400);
        return () => clearTimeout(timer);
      }
    }

    element.scrollTop = element.scrollHeight;
  }, [highlightId, initialMessages, scroller]);

  useEffect(() => {
    const root = scroller();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          void load(entry.target === topRef.current ? "older" : "newer");
        }
      },
      { root, rootMargin: "600px 0px" },
    );
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [load, scroller]);

  const resolvers = useMemo(() => makeResolvers(resolverMap), [resolverMap]);

  const chat = useMemo<ChatMessage[]>(
    () =>
      messages.map((message) => ({
        id: message.id,
        author,
        timestamp: new Date(message.ts).toISOString(),
        content: message.contents,
        attachments: message.attachments,
      })),
    [messages, author],
  );

  return (
    <MessageList
      className="message-scroller"
      messages={chat}
      resolvers={resolvers}
      empty={empty}
      header={
        <div ref={topRef}>
          {hasOlder ? <Loading label="Loading older messages" /> : intro}
        </div>
      }
      footer={
        <div ref={bottomRef}>
          {hasNewer ? <Loading label="Loading newer messages" /> : null}
        </div>
      }
    />
  );
}
