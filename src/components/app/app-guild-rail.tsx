"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumn,
  CircleUser,
  Search,
  Server,
  Users,
  Waypoints,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GuildRail, type GuildRailItem } from "@/components/layout/guild-rail";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type RailGuild = {
  id: string;
  name: string;
  iconUrl: string | null;
  separatorAfter?: boolean;
};

const FOOTER_LINKS = [
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/users", label: "User Directory", icon: Users },
  { href: "/account", label: "Account", icon: CircleUser },
  { href: "/activity", label: "Activity", icon: Waypoints },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumn },
  { href: "/search", label: "Search", icon: Search },
];

function FooterButton({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className="group relative flex size-12 items-center justify-center outline-none"
          />
        }
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 -left-3 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200",
            active ? "h-10" : "h-0 group-hover:h-5",
          )}
        />
        <span
          className={cn(
            "flex size-full items-center justify-center bg-surface-alt transition-all duration-200",
            "group-hover:rounded-2xl group-hover:bg-brand group-hover:text-white group-focus-visible:rounded-2xl",
            active
              ? "rounded-2xl bg-brand text-white"
              : "rounded-3xl text-interactive",
            "[&_svg]:size-5",
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppGuildRail({ guilds }: { guilds: RailGuild[] }) {
  const pathname = decodeURIComponent(usePathname());

  const items: GuildRailItem[] = guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    iconUrl: guild.iconUrl,
    href: `/channels/${guild.id}`,
    active:
      pathname === `/channels/${guild.id}` ||
      pathname.startsWith(`/channels/${guild.id}/`),
    separatorAfter: guild.separatorAfter,
  }));

  return (
    <TooltipProvider delay={150}>
      <div className="flex h-full w-[72px] shrink-0 flex-col bg-surface-3">
        <div className="min-h-0 flex-1">
          <GuildRail
            items={items}
            home={{
              href: "/channels/@me",
              label: "Direct Messages",
              active: pathname.startsWith("/channels/@me"),
            }}
          />
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 pt-1 pb-3">
          <span aria-hidden className="h-0.5 w-8 rounded-full bg-divider" />
          {FOOTER_LINKS.map(({ href, label, icon: Icon }) => (
            <FooterButton
              key={href}
              href={href}
              label={label}
              active={pathname === href || pathname.startsWith(`${href}/`)}
            >
              <Icon />
            </FooterButton>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
