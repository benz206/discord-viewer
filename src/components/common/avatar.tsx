"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  id?: string | null;
  size?: number;
  status?: PresenceStatus | null;
  ringColor?: string;
  rounded?: "full" | "lg";
  className?: string;
};

const DEFAULT_COLORS = [
  "var(--color-default-blurple)",
  "var(--color-default-grey)",
  "var(--color-default-green)",
  "var(--color-default-yellow)",
  "var(--color-default-red)",
  "var(--color-default-pink)",
];

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: "var(--color-online)",
  idle: "var(--color-idle)",
  dnd: "var(--color-dnd)",
  offline: "var(--color-offline)",
};

export function defaultAvatarIndex(id?: string | null, name?: string | null) {
  if (id && /^\d+$/.test(id)) {
    return Number((BigInt(id) >> BigInt(22)) % BigInt(6));
  }
  const seed = id ?? name ?? "";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
  }
  return hash % 6;
}

export function initialsFor(name?: string | null) {
  if (!name) return "?";
  const words = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  id,
  size = 40,
  status,
  ringColor = "var(--color-surface)",
  rounded = "full",
  className,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && failedSrc !== src;
  const dot = Math.max(8, Math.round(size * 0.32));

  return (
    <span
      className={cn("relative inline-block shrink-0 select-none", className)}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={name ?? ""}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src ?? null)}
          className={cn(
            "size-full bg-surface-3 object-cover",
            rounded === "full" ? "rounded-full" : "rounded-2xl",
          )}
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center font-medium text-white",
            rounded === "full" ? "rounded-full" : "rounded-2xl",
          )}
          style={{
            backgroundColor: DEFAULT_COLORS[defaultAvatarIndex(id, name)],
            fontSize: Math.max(9, Math.round(size * 0.38)),
          }}
        >
          {initialsFor(name)}
        </span>
      )}
      {status ? (
        <span
          className="absolute right-0 bottom-0 rounded-full"
          style={{
            width: dot,
            height: dot,
            backgroundColor: STATUS_COLORS[status],
            boxShadow: `0 0 0 ${Math.max(2, Math.round(size * 0.075))}px ${ringColor}`,
          }}
          aria-label={status}
        />
      ) : null}
    </span>
  );
}
