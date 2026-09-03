import Link from "next/link";

import { getUserEntry } from "@/lib/data/users";
import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";
import { userAvatarUrl, userDisplayName } from "@/components/users/user-avatar";

export function UserRef({
  id,
  size = 20,
  className,
  fallbackLabel,
}: {
  id: string | null | undefined;
  size?: number;
  className?: string;
  fallbackLabel?: string;
}) {
  if (!id) return <span className="text-faint">{fallbackLabel ?? "—"}</span>;

  const entry = getUserEntry(id);
  const label = entry ? userDisplayName(entry) : id;

  return (
    <Link
      href={`/users/${id}`}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded px-1 py-0.5 align-middle hover:bg-hover",
        className,
      )}
      title={`${label} · ${id}`}
    >
      <Avatar
        src={entry ? userAvatarUrl(id, entry.avatar, entry.discriminator) : null}
        name={entry?.name ?? id}
        id={id}
        size={size}
      />
      <span className="min-w-0 truncate text-sm text-header">{label}</span>
      {entry ? null : <span className="shrink-0 text-[11px] text-faint">unresolved</span>}
    </Link>
  );
}
