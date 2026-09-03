import { cn } from "@/lib/utils";

export function PageShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface text-normal">
      <div className="flex w-60 shrink-0 flex-col bg-surface-2">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col bg-surface">{children}</div>
    </div>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
      {icon ? <span className="shrink-0 text-channel [&_svg]:size-5">{icon}</span> : null}
      <h1 className="shrink-0 text-base leading-5 font-semibold text-header">{title}</h1>
      {subtitle ? (
        <>
          <span aria-hidden className="h-6 w-px shrink-0 bg-divider" />
          <div className="min-w-0 flex-1 truncate text-sm text-channel">{subtitle}</div>
        </>
      ) : (
        <div className="flex-1" />
      )}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("scrollbar-discord min-h-0 flex-1 overflow-y-auto", className)}>
      <div className="mx-auto w-full max-w-4xl px-8 py-8">{children}</div>
    </div>
  );
}

export function SidebarHeader({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 flex-col justify-center px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
      <div className="truncate text-base leading-5 font-semibold text-header">{title}</div>
      {subtitle ? <div className="truncate text-xs text-channel">{subtitle}</div> : null}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xs font-bold tracking-wide text-header uppercase">{title}</h2>
        <span aria-hidden className="h-px flex-1 bg-divider" />
        {actions}
      </div>
      {description ? <p className="mb-3 text-sm text-channel">{description}</p> : null}
      {children}
    </section>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg bg-surface-2 p-4", className)}>{children}</div>;
}

export function Pill({
  children,
  tone = "neutral",
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "danger" | "brand" | "warning";
  title?: string;
}) {
  const tones = {
    neutral: "bg-surface-3 text-channel",
    positive: "bg-positive/15 text-positive",
    danger: "bg-danger/15 text-danger",
    brand: "bg-brand/20 text-mention-fg",
    warning: "bg-warning/15 text-warning",
  } as const;
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
