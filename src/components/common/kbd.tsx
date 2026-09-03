import { cn } from "@/lib/utils";

export type KbdProps = {
  children: React.ReactNode;
  className?: string;
};

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border-b-2 border-surface-3 bg-elevated px-1.5",
        "font-sans text-[11px] leading-none font-semibold text-header",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
