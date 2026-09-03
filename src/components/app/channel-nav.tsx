"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChannelKind } from "@/components/layout/channel-icon";
import {
  ChannelSidebar,
  type SidebarCategory,
  type SidebarChannel,
} from "@/components/layout/channel-sidebar";
import { compactCount } from "@/components/app/format";

export type NavChannel = {
  id: string;
  name: string;
  href: string;
  kind: ChannelKind;
  messageCount: number;
};

export type NavCategory = {
  id: string;
  name: string;
  channels: NavChannel[];
};

export type ChannelNavProps = {
  title: string;
  subtitle?: string;
  channels?: NavChannel[];
  categories?: NavCategory[];
  placeholder?: string;
};

function Count({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className="shrink-0 text-[11px] leading-none font-medium tabular-nums text-faint">
      {compactCount(value)}
    </span>
  );
}

function toSidebarChannel(channel: NavChannel, pathname: string): SidebarChannel {
  return {
    id: channel.id,
    name: channel.name,
    href: channel.href,
    kind: channel.kind,
    active: pathname === channel.href,
    unread: channel.messageCount > 0,
    muted: channel.messageCount === 0,
    trailing: <Count value={channel.messageCount} />,
  };
}

function matches(channel: NavChannel, query: string) {
  return (
    channel.name.toLowerCase().includes(query) || channel.id.includes(query)
  );
}

export function ChannelNav({
  title,
  subtitle,
  channels,
  categories,
  placeholder = "Filter channels",
}: ChannelNavProps) {
  const pathname = decodeURIComponent(usePathname());
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const view = useMemo(() => {
    if (trimmed) {
      const all = [...(channels ?? []), ...(categories ?? []).flatMap((c) => c.channels)];
      return {
        channels: all
          .filter((channel) => matches(channel, trimmed))
          .slice(0, 200)
          .map((channel) => toSidebarChannel(channel, pathname)),
        categories: [] as SidebarCategory[],
        total: all.filter((channel) => matches(channel, trimmed)).length,
      };
    }
    return {
      channels: (channels ?? []).map((channel) => toSidebarChannel(channel, pathname)),
      categories: (categories ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        channels: category.channels.map((channel) => toSidebarChannel(channel, pathname)),
        defaultOpen: true,
      })),
      total: 0,
    };
  }, [channels, categories, pathname, trimmed]);

  return (
    <ChannelSidebar
      className="w-60 shrink-0 bg-surface-2"
      title={title}
      subtitle={subtitle}
      channels={view.channels}
      categories={view.categories}
      toolbar={
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-7 w-full rounded bg-surface-3 py-1 pr-7 pl-2 text-sm text-normal outline-none",
              "placeholder:text-faint focus:ring-1 focus:ring-brand",
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          <Search className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-faint" />
        </div>
      }
      footer={
        trimmed ? (
          <div className="px-2 py-1 text-[11px] text-faint">
            {view.total} match{view.total === 1 ? "" : "es"}
            {view.total > 200 ? " (showing first 200)" : ""}
          </div>
        ) : null
      }
    />
  );
}
