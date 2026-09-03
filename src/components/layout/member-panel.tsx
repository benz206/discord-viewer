"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Avatar, type PresenceStatus } from "@/components/common/avatar";

export type PanelMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  color?: string | null;
  status?: PresenceStatus;
  bot?: boolean;
  subtitle?: string | null;
  href?: string;
};

export type MemberGroup = {
  id: string;
  name: string;
  members: PanelMember[];
};

export type MemberPanelProps = {
  groups: MemberGroup[];
  title?: string;
  onSelect?: (member: PanelMember) => void;
  footer?: React.ReactNode;
  className?: string;
};

function MemberRow({
  member,
  onSelect,
}: {
  member: PanelMember;
  onSelect?: (member: PanelMember) => void;
}) {
  const content = (
    <>
      <Avatar
        src={member.avatarUrl}
        name={member.name}
        id={member.id}
        size={32}
        status={member.status}
        ringColor="var(--color-surface-2)"
      />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[15px] leading-5 font-medium text-channel group-hover:text-interactive-hover"
          style={member.color ? { color: member.color } : undefined}
        >
          {member.name}
        </span>
        {member.subtitle ? (
          <span className="block truncate text-xs text-channel">
            {member.subtitle}
          </span>
        ) : null}
      </span>
      {member.bot ? (
        <span className="rounded bg-brand px-1 py-px text-[10px] leading-[14px] font-medium text-white uppercase">
          Bot
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "group flex w-full items-center gap-3 rounded px-2 py-1 text-left outline-none",
    "transition-colors hover:bg-hover focus-visible:bg-hover",
  );

  return (
    <li>
      {member.href ? (
        <Link href={member.href} className={className}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onSelect ? () => onSelect(member) : undefined}
          className={className}
        >
          {content}
        </button>
      )}
    </li>
  );
}

export function MemberPanel({
  groups,
  title,
  onSelect,
  footer,
  className,
}: MemberPanelProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {title ? (
        <div className="flex h-12 shrink-0 items-center px-4 text-sm font-semibold text-header">
          {title}
        </div>
      ) : null}
      <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {groups.map((group) => (
          <section key={group.id} className="mb-4 last:mb-0">
            <h3 className="mb-1 px-2 text-xs leading-4 font-semibold tracking-wide text-channel uppercase">
              {group.name}
              <span className="ml-1 tabular-nums">
                &mdash; {group.members.length}
              </span>
            </h3>
            <ul className="space-y-0.5">
              {group.members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {footer ? <div className="shrink-0 p-2">{footer}</div> : null}
    </div>
  );
}
