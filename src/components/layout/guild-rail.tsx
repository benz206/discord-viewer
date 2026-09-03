"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type GuildRailItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
  href: string;
  active?: boolean;
  unread?: boolean;
  badge?: number;
  separatorAfter?: boolean;
};

export type GuildRailProps = {
  items: GuildRailItem[];
  home?: { href: string; label?: string; active?: boolean; unread?: boolean };
  footer?: React.ReactNode;
  className?: string;
};

function railInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 3)
    .map((word) => [...word][0])
    .join("");
}

function Pill({ active, unread }: { active?: boolean; unread?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 -left-3 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200",
        active ? "h-10" : unread ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
      )}
    />
  );
}

function RailButton({
  href,
  label,
  active,
  unread,
  badge,
  children,
  brand,
}: {
  href: string;
  label: string;
  active?: boolean;
  unread?: boolean;
  badge?: number;
  children: React.ReactNode;
  brand?: boolean;
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
        <Pill active={active} unread={unread} />
        <span
          className={cn(
            "flex size-full items-center justify-center overflow-hidden bg-surface-alt text-header transition-all duration-200",
            "group-hover:rounded-2xl group-hover:bg-brand group-hover:text-white group-focus-visible:rounded-2xl",
            active ? "rounded-2xl bg-brand text-white" : "rounded-3xl",
            brand && !active && "text-white",
          )}
        >
          {children}
        </span>
        {badge ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-[3px] border-surface-3 bg-danger px-1 text-[11px] leading-none font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function GuildRail({ items, home, footer, className }: GuildRailProps) {
  return (
    <TooltipProvider delay={150}>
      <nav
        aria-label="Servers"
        className={cn(
          "scrollbar-none flex h-full w-[72px] flex-col items-center gap-2 overflow-y-auto py-3",
          className,
        )}
      >
        {home ? (
          <>
            <RailButton
              href={home.href}
              label={home.label ?? "Direct Messages"}
              active={home.active}
              unread={home.unread}
              brand
            >
              <MessagesSquare className="size-6" />
            </RailButton>
            <span
              aria-hidden
              className="my-0.5 h-0.5 w-8 shrink-0 rounded-full bg-divider"
            />
          </>
        ) : null}

        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-2">
            <RailButton
              href={item.href}
              label={item.name}
              active={item.active}
              unread={item.unread}
              badge={item.badge}
            >
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <span className="px-1 text-center text-sm leading-none font-medium">
                  {railInitials(item.name)}
                </span>
              )}
            </RailButton>
            {item.separatorAfter ? (
              <span
                aria-hidden
                className="my-0.5 h-0.5 w-8 shrink-0 rounded-full bg-divider"
              />
            ) : null}
          </div>
        ))}

        {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
      </nav>
    </TooltipProvider>
  );
}
