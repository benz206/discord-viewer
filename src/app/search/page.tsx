import Link from "next/link";
import { Search } from "lucide-react";

import { getChannel } from "@/lib/data/channels";
import { getMessageCountByGuild, searchMessages } from "@/lib/data/messages";
import { getOwnerId, getPackageStats, getUser, getUserAvatarPath } from "@/lib/data/meta";
import { EmptyState } from "@/components/common/empty-state";
import { channelKindFromType } from "@/components/layout/channel-icon";
import { channelLabel } from "@/lib/resolvers";
import { PaneHeader } from "@/components/app/overview";
import { SearchFilters } from "@/components/app/search-filters";
import { SearchResultRow, type SearchResultItem } from "@/components/app/search-results";
import { formatCount } from "@/components/app/format";

const PAGE_SIZE = 25;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function guildKey(guildId: string | null, type: number): string {
  if (guildId) return guildId;
  return type === 1 || type === 3 ? "@me" : "unknown";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const guildId = first(params.guildId);
  const channelId = first(params.channelId);
  const orderParam = first(params.order);
  const order =
    orderParam === "oldest" || orderParam === "relevance" ? orderParam : "newest";
  const page = Math.max(Number(first(params.page)) || 1, 1);

  const result = query
    ? searchMessages(query, {
        guildId: guildId || undefined,
        channelId: channelId || undefined,
        order,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
    : { hits: [], total: 0 };

  const owner = getUser();
  const avatarPath = getUserAvatarPath();
  const author = {
    id: owner?.id ?? getOwnerId() ?? "owner",
    name: owner?.username ?? "You",
    avatarUrl: avatarPath ? `/api/asset/${avatarPath}` : null,
  };

  const items: SearchResultItem[] = result.hits.map((hit) => {
    const channel = getChannel(hit.channelId);
    const type = channel?.type ?? 0;
    return {
      id: hit.id,
      href: `/channels/${guildKey(hit.guildId, type)}/${hit.channelId}?message=${hit.id}`,
      ts: hit.ts,
      snippet: hit.snippet,
      channelName: channel ? channelLabel(channel) : (hit.channelName ?? hit.channelId),
      channelKind: channelKindFromType(type),
      guildName: hit.guildName,
      attachmentCount: hit.attachments.length,
    };
  });

  const activeChannel = channelId ? getChannel(channelId) : null;
  const guilds = getMessageCountByGuild()
    .filter((entry) => entry.guildId && entry.guildName)
    .map((entry) => ({
      id: entry.guildId as string,
      name: entry.guildName as string,
      count: entry.count,
    }));

  const pageCount = Math.ceil(result.total / PAGE_SIZE);
  const pageHref = (next: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (guildId) search.set("guildId", guildId);
    if (channelId) search.set("channelId", channelId);
    if (orderParam) search.set("order", orderParam);
    if (next > 1) search.set("page", String(next));
    return `/search?${search.toString()}`;
  };

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <SearchFilters
        query={query}
        guildId={guildId}
        channelId={channelId}
        channelLabel={activeChannel ? channelLabel(activeChannel) : null}
        order={order}
        guilds={guilds}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <PaneHeader
          icon={<Search />}
          title={
            query ? (
              <>
                {formatCount(result.total)} result{result.total === 1 ? "" : "s"} for
                <span className="ml-1 text-normal">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Search"
            )
          }
        />

        <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto p-4">
          {!query ? (
            <EmptyState
              icon={<Search />}
              title="Search every message"
              description={`${formatCount(getPackageStats().messageCount)} messages are indexed. Type a query to begin, or open a channel and use its search box to scope results.`}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No results"
              description="Nothing matched that query with the current filters."
            />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
              {items.map((item) => (
                <SearchResultRow key={item.id} item={item} author={author} />
              ))}

              {pageCount > 1 ? (
                <nav className="mt-4 flex items-center justify-between text-sm">
                  {page > 1 ? (
                    <Link href={pageHref(page - 1)} className="text-link hover:underline">
                      ← Previous
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-channel">
                    Page {formatCount(page)} of {formatCount(pageCount)}
                  </span>
                  {page < pageCount ? (
                    <Link href={pageHref(page + 1)} className="text-link hover:underline">
                      Next →
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
