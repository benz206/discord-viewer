"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, FileJson2, LayoutList, Search, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCompact, formatCount } from "@/components/activity/format";
import { domainColor, sortDomains } from "@/components/activity/domains";

export type SidebarDomain = { domain: string; count: number; typeCount: number };
export type SidebarType = { domain: string; eventType: string; count: number };

export type ActivitySidebarProps = {
  domains: SidebarDomain[];
  types: SidebarType[];
  totalEvents: number;
};

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mx-2 flex h-8 items-center gap-1.5 rounded px-2 text-[15px] leading-5 transition-colors",
        active ? "bg-selected text-header" : "text-channel hover:bg-hover hover:text-interactive-hover",
      )}
    >
      <span className="flex size-5 items-center justify-center [&_svg]:size-4">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Link>
  );
}

export function ActivitySidebar({ domains, types, totalEvents }: ActivitySidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activeDomain = searchParams.get("domain");
  const activeType = searchParams.get("eventType");
  const onExplorer = pathname === "/activity";

  const hrefFor = (domain?: string, eventType?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    params.delete("domain");
    params.delete("eventType");
    if (domain) params.set("domain", domain);
    if (eventType) params.set("eventType", eventType);
    const text = params.toString();
    return `/activity${text ? `?${text}` : ""}`;
  };

  const needle = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const filtered = needle
      ? types.filter((type) => type.eventType.toLowerCase().includes(needle))
      : types;
    return sortDomains(domains).map((domain) => ({
      ...domain,
      types: filtered.filter((type) => type.domain === domain.domain),
    }));
  }, [domains, types, needle]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base leading-5 font-semibold text-header">Activity</div>
          <div className="truncate text-xs text-channel">{formatCount(totalEvents)} events</div>
        </div>
      </div>

      <div className="shrink-0 px-2 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-channel" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter event types"
            className="h-7 w-full rounded bg-surface-3 pr-2 pl-7 text-sm text-normal outline-none placeholder:text-channel"
          />
        </div>
      </div>

      <nav aria-label="Activity" className="scrollbar-discord min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="space-y-0.5">
          <NavLink
            href={hrefFor()}
            active={onExplorer && !activeDomain && !activeType}
            icon={<LayoutList />}
          >
            All events
          </NavLink>
          <NavLink href="/activity/types" active={pathname === "/activity/types"} icon={<Table2 />}>
            Event types
          </NavLink>
          <NavLink href="/activity/sources" active={pathname === "/activity/sources"} icon={<FileJson2 />}>
            Source files
          </NavLink>
        </div>

        {groups.map((group) => {
          const open = !collapsed[group.domain];
          return (
            <div key={group.domain} className="mt-4">
              <div className="flex items-center gap-0.5 pr-2 pl-2">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [group.domain]: !collapsed[group.domain] }))
                  }
                  aria-expanded={open}
                  className="flex h-6 min-w-0 flex-1 items-center gap-0.5 text-[11px] leading-4 font-semibold tracking-wide text-channel uppercase transition-colors hover:text-interactive-hover"
                >
                  <ChevronDown className={cn("size-3 shrink-0 transition-transform", !open && "-rotate-90")} />
                  <span
                    aria-hidden
                    className="mr-1 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: domainColor(group.domain) }}
                  />
                  <span className="truncate">{group.domain}</span>
                  <span className="ml-auto shrink-0 pl-1 text-faint tabular-nums normal-case">
                    {formatCompact(group.count)}
                  </span>
                </button>
              </div>
              {open ? (
                <ul className="mt-0.5 space-y-0.5">
                  <li>
                    <Link
                      href={hrefFor(group.domain)}
                      className={cn(
                        "mx-2 flex h-7 items-center gap-1.5 rounded px-2 text-sm transition-colors",
                        onExplorer && activeDomain === group.domain && !activeType
                          ? "bg-selected text-header"
                          : "text-channel hover:bg-hover hover:text-interactive-hover",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate italic">all {group.typeCount} types</span>
                    </Link>
                  </li>
                  {group.types.map((type) => {
                    const active =
                      onExplorer && activeDomain === group.domain && activeType === type.eventType;
                    return (
                      <li key={type.eventType}>
                        <Link
                          href={hrefFor(group.domain, type.eventType)}
                          className={cn(
                            "group mx-2 flex h-7 items-center gap-1.5 rounded px-2 text-sm transition-colors",
                            active
                              ? "bg-selected text-header"
                              : "text-channel hover:bg-hover hover:text-interactive-hover",
                          )}
                          title={`${type.eventType} — ${formatCount(type.count)} events`}
                        >
                          <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                            {type.eventType}
                          </span>
                          <span className="shrink-0 text-[11px] text-faint tabular-nums">
                            {formatCompact(type.count)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  {needle && group.types.length === 0 ? (
                    <li className="mx-4 py-1 text-xs text-faint">no match</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
