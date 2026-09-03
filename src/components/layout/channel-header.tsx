"use client";

import { Search, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChannelIcon, type ChannelKind } from "@/components/layout/channel-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ChannelHeaderSearch = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export type ChannelHeaderAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export type ChannelHeaderProps = {
  name: string;
  kind?: ChannelKind;
  topic?: React.ReactNode;
  actions?: ChannelHeaderAction[];
  search?: ChannelHeaderSearch;
  onToggleMembers?: () => void;
  membersActive?: boolean;
  className?: string;
};

function IconButton({ action }: { action: ChannelHeaderAction }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            aria-pressed={action.active}
            className={cn(
              "flex size-6 items-center justify-center rounded transition-colors outline-none",
              "[&_svg]:size-6",
              action.active
                ? "text-interactive-active"
                : "text-interactive hover:text-interactive-hover",
            )}
          />
        }
      >
        {action.icon}
      </TooltipTrigger>
      <TooltipContent side="bottom">{action.label}</TooltipContent>
    </Tooltip>
  );
}

export function ChannelHeader({
  name,
  kind = "text",
  topic,
  actions,
  search,
  onToggleMembers,
  membersActive,
  className,
}: ChannelHeaderProps) {
  return (
    <TooltipProvider delay={200}>
      <header
        className={cn(
          "flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]",
          className,
        )}
      >
        <ChannelIcon kind={kind} className="size-6 text-channel" />
        <h1 className="shrink-0 text-base leading-5 font-semibold text-header">
          {name}
        </h1>

        {topic ? (
          <>
            <span
              aria-hidden
              className="h-6 w-px shrink-0 bg-divider"
            />
            <div className="min-w-0 flex-1 truncate text-sm text-channel">
              {topic}
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-4">
          {actions?.map((action) => (
            <IconButton key={action.id} action={action} />
          ))}

          {onToggleMembers ? (
            <IconButton
              action={{
                id: "members",
                label: "Member List",
                icon: <Users />,
                active: membersActive,
                onClick: onToggleMembers,
              }}
            />
          ) : null}

          {search ? (
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const input = event.currentTarget.elements.namedItem(
                  "channel-search",
                ) as HTMLInputElement | null;
                search.onSubmit?.(input?.value ?? "");
              }}
              className="relative"
            >
              <input
                name="channel-search"
                type="search"
                value={search.value}
                defaultValue={search.defaultValue}
                onChange={(event) => search.onChange?.(event.target.value)}
                placeholder={search.placeholder ?? "Search"}
                className={cn(
                  "h-6 w-36 rounded bg-surface-3 py-0.5 pr-6 pl-2 text-sm text-normal transition-[width] outline-none",
                  "placeholder:text-channel focus:w-60",
                  "[&::-webkit-search-cancel-button]:appearance-none",
                )}
              />
              <Search className="pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 text-channel" />
            </form>
          ) : null}
        </div>
      </header>
    </TooltipProvider>
  );
}
