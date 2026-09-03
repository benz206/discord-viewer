import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";

export type UserTagProps = {
  name: string;
  id?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
  bot?: boolean;
  subtitle?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export function UserTag({
  name,
  id,
  avatarUrl,
  color,
  bot,
  subtitle,
  size = "md",
  className,
}: UserTagProps) {
  const avatarSize = size === "sm" ? 20 : 24;

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Avatar src={avatarUrl} name={name} id={id} size={avatarSize} />
      <span className="min-w-0 truncate">
        <span
          className={cn(
            "font-medium text-header",
            size === "sm" ? "text-xs" : "text-sm",
          )}
          style={color ? { color } : undefined}
        >
          {name}
        </span>
        {subtitle ? (
          <span className="ml-1.5 text-xs text-channel">{subtitle}</span>
        ) : null}
      </span>
      {bot ? (
        <span className="rounded bg-brand px-1 py-px text-[10px] leading-[14px] font-medium text-white uppercase">
          Bot
        </span>
      ) : null}
    </span>
  );
}
