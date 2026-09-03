"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount } from "@/components/app/format";

export type SearchGuildOption = { id: string; name: string; count: number };

export type SearchFiltersProps = {
  query: string;
  guildId: string;
  channelId: string;
  channelLabel: string | null;
  order: string;
  guilds: SearchGuildOption[];
};

const SELECT_CLASS =
  "h-8 w-full rounded bg-surface-3 px-2 text-sm text-normal outline-none focus:ring-1 focus:ring-brand";

export function SearchFilters({
  query,
  guildId,
  channelId,
  channelLabel,
  order,
  guilds,
}: SearchFiltersProps) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  const go = (next: Partial<Record<"q" | "guildId" | "channelId" | "order", string>>) => {
    const params = new URLSearchParams();
    const merged = { q: value, guildId, channelId, order, ...next };
    for (const [key, entry] of Object.entries(merged)) {
      if (entry) params.set(key, entry);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex w-60 shrink-0 flex-col gap-4 bg-surface-2 p-3">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: value });
        }}
        className="relative"
      >
        <input
          name="q"
          type="search"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search all messages"
          className={cn(
            "h-9 w-full rounded bg-surface-3 py-1 pr-8 pl-2.5 text-sm text-normal outline-none",
            "placeholder:text-faint focus:ring-1 focus:ring-brand",
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
        <Search className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-faint" />
      </form>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-channel uppercase">
          Server
        </span>
        <select
          value={guildId}
          onChange={(event) => go({ guildId: event.target.value, channelId: "" })}
          className={SELECT_CLASS}
        >
          <option value="">All servers and DMs</option>
          {guilds.map((guild) => (
            <option key={guild.id} value={guild.id}>
              {guild.name} ({formatCount(guild.count)})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-channel uppercase">
          Sort
        </span>
        <select
          value={order}
          onChange={(event) => go({ order: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="relevance">Most relevant</option>
        </select>
      </label>

      {channelId ? (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-wide text-channel uppercase">
            Channel
          </span>
          <button
            type="button"
            onClick={() => go({ channelId: "" })}
            className="flex items-center gap-1.5 rounded bg-mention px-2 py-1 text-left text-sm text-mention-fg transition-colors hover:bg-mention-hover hover:text-white"
          >
            <span className="min-w-0 flex-1 truncate">{channelLabel ?? channelId}</span>
            <X className="size-3.5 shrink-0" />
          </button>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-faint">
        Full-text search over every message in the export. Quote a phrase for an exact
        match, or add <code className="rounded bg-code px-1">*</code> for a prefix search.
      </p>
    </div>
  );
}
