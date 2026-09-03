import { cn } from "@/lib/utils";

export type AppShellProps = {
  rail?: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  panel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({
  rail,
  sidebar,
  header,
  panel,
  children,
  className,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-dvh w-full overflow-hidden bg-surface text-normal",
        className,
      )}
    >
      {rail ? (
        <div className="flex w-[72px] shrink-0 flex-col bg-surface-3">
          {rail}
        </div>
      ) : null}
      {sidebar ? (
        <div className="flex w-60 shrink-0 flex-col bg-surface-2">
          {sidebar}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        {header}
        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          {panel ? (
            <aside className="hidden w-60 shrink-0 flex-col bg-surface-2 lg:flex">
              {panel}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
