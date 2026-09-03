import { cn } from "@/lib/utils";

export function SettingsPage({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-10 py-14">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-header">{title}</h1>
          {description ? <p className="mt-1 text-sm text-channel">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

export function Section({
  title,
  count,
  description,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {title ? (
        <div className="flex items-baseline justify-between gap-3 border-b border-divider pb-1.5">
          <h2 className="text-xs font-bold tracking-wide text-header uppercase">
            {title}
            {count === undefined ? null : <span className="ml-2 font-medium text-channel">{count}</span>}
          </h2>
          {action}
        </div>
      ) : null}
      {description ? <p className="text-sm text-channel">{description}</p> : null}
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
  tone?: "neutral" | "brand" | "positive" | "danger" | "warning";
  title?: string;
}) {
  const tones = {
    neutral: "bg-surface-3 text-subhead",
    brand: "bg-brand/25 text-mention-fg",
    positive: "bg-positive/20 text-positive",
    danger: "bg-danger/20 text-danger",
    warning: "bg-warning/20 text-warning",
  } as const;
  return (
    <span
      title={title}
      className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", tones[tone])}
    >
      {children}
    </span>
  );
}

export function BoolValue({ value }: { value: boolean }) {
  return <Pill tone={value ? "positive" : "neutral"}>{value ? "Yes" : "No"}</Pill>;
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px] break-all text-subhead", className)}>{children}</span>;
}
