import Link from "next/link";

import { cn } from "@/lib/utils";

export function PaneHeader({
  icon,
  title,
  actions,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
      {icon ? <span className="text-channel [&_svg]:size-6">{icon}</span> : null}
      <h1 className="min-w-0 flex-1 truncate text-base leading-5 font-semibold text-header">
        {title}
      </h1>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PaneBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("scrollbar-discord min-h-0 flex-1 overflow-y-auto p-6", className)}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">{children}</div>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-channel uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] font-semibold tracking-wide text-channel uppercase">
        {label}
      </div>
      <div className="mt-0.5 truncate text-lg leading-6 font-semibold tabular-nums text-header">
        {value}
      </div>
      {hint ? <div className="truncate text-xs text-faint">{hint}</div> : null}
    </div>
  );
}

export function LinkRow({
  href,
  leading,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2 transition-colors hover:bg-hover"
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-header">{title}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-channel">{subtitle}</span>
        ) : null}
      </span>
      {trailing ? (
        <span className="shrink-0 text-xs tabular-nums text-channel">{trailing}</span>
      ) : null}
    </Link>
  );
}
