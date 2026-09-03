import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-surface-2 px-4 py-3", className)}>
      <p className="text-[11px] font-semibold tracking-wide text-channel uppercase">{label}</p>
      <p className="pt-1 text-xl font-semibold text-header">{value}</p>
      {hint ? <p className="pt-0.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function StatsSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-divider pb-1.5">
        <h2 className="text-xs font-bold tracking-wide text-header uppercase">{title}</h2>
        {action}
      </div>
      {description ? <p className="text-sm text-channel">{description}</p> : null}
      {children}
    </section>
  );
}
