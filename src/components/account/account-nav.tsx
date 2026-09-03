"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Braces,
  Contact,
  CreditCard,
  Gamepad2,
  Library,
  Link2,
  Monitor,
  Settings,
  StickyNote,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: string;
};

const GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "User Settings",
    items: [
      { href: "/account", label: "My Account", icon: User },
      { href: "/account/settings", label: "Settings", icon: Settings, countKey: "settings" },
      { href: "/account/connections", label: "Connections", icon: Link2, countKey: "connections" },
      { href: "/account/friends", label: "Friends", icon: Users, countKey: "relationships" },
      { href: "/account/notes", label: "Notes", icon: StickyNote, countKey: "notes" },
      { href: "/account/sessions", label: "Sessions", icon: Monitor, countKey: "sessions" },
    ],
  },
  {
    label: "Billing Settings",
    items: [
      { href: "/account/billing", label: "Billing", icon: CreditCard, countKey: "payments" },
      { href: "/account/library", label: "Library", icon: Library, countKey: "library" },
    ],
  },
  {
    label: "Package Data",
    items: [
      { href: "/account/guild-settings", label: "Guild Settings", icon: Bell, countKey: "guildSettings" },
      { href: "/account/applications", label: "Applications", icon: Bot, countKey: "applications" },
      { href: "/account/activity-stats", label: "Activity Statistics", icon: Gamepad2, countKey: "activityStats" },
      { href: "/account/friend-suggestions", label: "Friend Suggestions", icon: UserPlus, countKey: "friendSuggestions" },
      { href: "/account/external-friends", label: "External Friends", icon: Contact, countKey: "externalFriends" },
    ],
  },
  {
    label: "Advanced",
    items: [{ href: "/account/raw", label: "Raw user.json", icon: Braces }],
  },
];

export function AccountNav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-discord flex w-60 shrink-0 flex-col gap-4 overflow-y-auto bg-surface-2 px-3 py-14">
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <h2 className="px-2.5 pb-1 text-[11px] font-bold tracking-wide text-channel uppercase">{group.label}</h2>
          {group.items.map((item) => {
            const active = pathname === item.href;
            const count = item.countKey ? counts[item.countKey] : undefined;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-sm font-medium",
                  active ? "bg-selected text-header" : "text-interactive hover:bg-hover hover:text-interactive-hover",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {count === undefined ? null : (
                  <span className="shrink-0 text-[11px] font-semibold text-channel">{count}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
