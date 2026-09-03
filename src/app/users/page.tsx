import Link from "next/link";
import { Search, Users } from "lucide-react";

import { buildUserDirectory, countUsers, listUsers } from "@/lib/data/users";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { USER_SOURCE_LABELS } from "@/components/servers/constants";
import { formatNumber } from "@/components/servers/format";
import { PageBody, PageHeader, PageShell, Pill, Section, SidebarHeader } from "@/components/servers/page-shell";
import { userAvatarUrl, userDisplayName } from "@/components/users/user-avatar";
import { cn } from "@/lib/utils";

export const metadata = { title: "Users · Discord Viewer" };

const PAGE_SIZE = 50;

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === 0) continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; offset?: string }>;
}) {
  const { q, source, offset } = await searchParams;
  const search = q?.trim() ?? "";
  const start = Math.max(0, Number(offset ?? "0") || 0);

  const directory = buildUserDirectory();
  const sourceCounts = new Map<string, number>();
  for (const entry of directory.values()) {
    for (const key of entry.sources) sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const sources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const filter = { search: search || undefined, source: source || undefined };
  const total = countUsers(filter);
  const visible = listUsers({ ...filter, limit: PAGE_SIZE, offset: start });
  const hasMore = start + visible.length < total;

  return (
    <PageShell
      sidebar={
        <>
          <SidebarHeader title="Users" subtitle={`${formatNumber(directory.size)} known users`} />
          <nav aria-label="Sources" className="scrollbar-discord min-h-0 flex-1 overflow-y-auto py-3">
            <div className="mb-1 px-4 text-[11px] leading-4 font-semibold tracking-wide text-channel uppercase">
              Source
            </div>
            <ul className="space-y-0.5 px-2">
              <li>
                <Link
                  href={`/users${queryString({ q: search })}`}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded px-2.5 text-[15px] transition-colors",
                    !source ? "bg-selected text-header" : "text-channel hover:bg-hover hover:text-interactive-hover",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">All users</span>
                  <span className="shrink-0 rounded bg-surface-3 px-1.5 text-[11px] leading-4">{directory.size}</span>
                </Link>
              </li>
              {sources.map(([key, count]) => (
                <li key={key}>
                  <Link
                    href={`/users${queryString({ q: search, source: key })}`}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded px-2.5 text-[15px] transition-colors",
                      source === key
                        ? "bg-selected text-header"
                        : "text-channel hover:bg-hover hover:text-interactive-hover",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{USER_SOURCE_LABELS[key] ?? key}</span>
                    <span className="shrink-0 rounded bg-surface-3 px-1.5 text-[11px] leading-4">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      }
    >
      <PageHeader
        icon={<Users />}
        title="Users"
        subtitle={`Everyone the package mentions — DM partners, friends, bans, audit actors, bots`}
      />
      <PageBody>
        <form action="/users" method="get" className="mb-6 flex flex-wrap gap-2">
          {source ? <input type="hidden" name="source" value={source} /> : null}
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-channel" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search by name or user id"
              className="h-9 w-full rounded bg-surface-3 pr-3 pl-8 text-sm text-normal outline-none placeholder:text-channel"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Search
          </button>
          {search || source ? (
            <Link
              href="/users"
              className="flex h-9 items-center rounded bg-surface-3 px-4 text-sm text-channel hover:text-interactive-hover"
            >
              Reset
            </Link>
          ) : null}
        </form>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No users match"
            description="Try a different name, id, or source filter."
          />
        ) : (
          <Section
            title={`${source ? (USER_SOURCE_LABELS[source] ?? source) : "All users"} · ${start + 1}–${start + visible.length} of ${formatNumber(total)}`}
          >
            <ul className="space-y-1.5">
              {visible.map((entry) => {
                const note = entry.note;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/users/${entry.id}`}
                      className="flex items-start gap-3 rounded-lg bg-surface-2 px-3 py-2.5 transition-colors hover:bg-hover"
                    >
                      <Avatar
                        src={userAvatarUrl(entry.id, entry.avatar, entry.discriminator)}
                        name={entry.name}
                        id={entry.id}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-header">{userDisplayName(entry)}</div>
                        <div className="font-mono text-[11px] text-faint">{entry.id}</div>
                        {note ? (
                          <p className="mt-1 line-clamp-2 text-xs text-channel">
                            <span className="text-faint">Note: </span>
                            {note}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex max-w-[45%] shrink-0 flex-wrap justify-end gap-1">
                        {entry.sources.map((key) => (
                          <Pill key={key} tone="brand">
                            {USER_SOURCE_LABELS[key] ?? key}
                          </Pill>
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between text-sm">
              {start > 0 ? (
                <Link
                  href={`/users${queryString({ q: search, source, offset: Math.max(0, start - PAGE_SIZE) })}`}
                  className="text-link hover:underline"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-channel">
                {start + 1}–{start + visible.length} of {formatNumber(total)}
              </span>
              {hasMore ? (
                <Link
                  href={`/users${queryString({ q: search, source, offset: start + PAGE_SIZE })}`}
                  className="text-link hover:underline"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          </Section>
        )}
      </PageBody>
    </PageShell>
  );
}
