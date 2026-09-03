"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChannelIcon, type ChannelKind } from "@/components/layout/channel-icon";

export type SidebarChannel = {
  id: string;
  name: string;
  href: string;
  kind?: ChannelKind;
  active?: boolean;
  muted?: boolean;
  unread?: boolean;
  badge?: string | number;
  trailing?: React.ReactNode;
};

export type SidebarCategory = {
  id: string;
  name: string;
  channels: SidebarChannel[];
  defaultOpen?: boolean;
};

export type ChannelSidebarProps = {
  title: string;
  subtitle?: string;
  channels?: SidebarChannel[];
  categories?: SidebarCategory[];
  headerAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

function ChannelRow({ channel }: { channel: SidebarChannel }) {
  return (
    <li>
      <Link
        href={channel.href}
        aria-current={channel.active ? "page" : undefined}
        className={cn(
          "group mx-2 flex h-8 items-center gap-1.5 rounded px-2 outline-none",
          "text-[15px] leading-5 transition-colors hover:bg-hover focus-visible:bg-hover",
          channel.active
            ? "bg-selected text-header"
            : channel.unread
              ? "text-header hover:text-interactive-hover"
              : "text-channel hover:text-interactive-hover",
          channel.muted && !channel.active && "opacity-50",
        )}
      >
        <ChannelIcon
          kind={channel.kind}
          className="size-5 text-channel group-hover:text-interactive"
        />
        <span className="min-w-0 flex-1 truncate">{channel.name}</span>
        {channel.badge !== undefined ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[11px] leading-none font-bold text-white">
            {channel.badge}
          </span>
        ) : null}
        {channel.trailing}
      </Link>
    </li>
  );
}

function Category({ category }: { category: SidebarCategory }) {
  const [open, setOpen] = useState(category.defaultOpen ?? true);
  const visible = open
    ? category.channels
    : category.channels.filter((channel) => channel.active || channel.unread);

  return (
    <li className="mt-4 first:mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-6 w-full items-center gap-0.5 px-2 text-[11px] leading-4 font-semibold tracking-wide text-channel uppercase transition-colors hover:text-interactive-hover"
      >
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform",
            !open && "-rotate-90",
          )}
        />
        <span className="truncate">{category.name}</span>
      </button>
      <ul className="mt-0.5 space-y-0.5">
        {visible.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} />
        ))}
      </ul>
    </li>
  );
}

export function ChannelSidebar({
  title,
  subtitle,
  channels,
  categories,
  headerAction,
  toolbar,
  footer,
  className,
}: ChannelSidebarProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base leading-5 font-semibold text-header">
            {title}
          </div>
          {subtitle ? (
            <div className="truncate text-xs text-channel">{subtitle}</div>
          ) : null}
        </div>
        {headerAction}
      </div>

      {toolbar ? <div className="shrink-0 px-2 py-2">{toolbar}</div> : null}

      <nav
        aria-label="Channels"
        className="scrollbar-discord min-h-0 flex-1 overflow-y-auto pb-4"
      >
        <ul>
          {channels?.length ? (
            <li className="mt-2">
              <ul className="space-y-0.5">
                {channels.map((channel) => (
                  <ChannelRow key={channel.id} channel={channel} />
                ))}
              </ul>
            </li>
          ) : null}
          {categories?.map((category) => (
            <Category key={category.id} category={category} />
          ))}
        </ul>
      </nav>

      {footer ? (
        <div className="shrink-0 bg-surface-alt px-2 py-1.5">{footer}</div>
      ) : null}
    </div>
  );
}
