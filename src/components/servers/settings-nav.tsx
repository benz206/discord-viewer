"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  href: string;
  label: string;
  count?: number | null;
  missing?: boolean;
}

export interface SettingsNavGroup {
  id: string;
  label: string;
  items: SettingsNavItem[];
}

export function SettingsNav({ groups }: { groups: SettingsNavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Server settings" className="scrollbar-discord min-h-0 flex-1 overflow-y-auto py-3">
      {groups.map((group) => (
        <div key={group.id} className="mb-4">
          <div className="mb-1 px-4 text-[11px] leading-4 font-semibold tracking-wide text-channel uppercase">
            {group.label}
          </div>
          <ul className="space-y-0.5 px-2">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded px-2.5 text-[15px] leading-5 transition-colors",
                      active
                        ? "bg-selected text-header"
                        : "text-channel hover:bg-hover hover:text-interactive-hover",
                      item.missing && !active && "opacity-50",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.count !== null && item.count !== undefined ? (
                      <span className="shrink-0 rounded bg-surface-3 px-1.5 text-[11px] leading-4 text-channel">
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
