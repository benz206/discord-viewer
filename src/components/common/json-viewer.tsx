"use client";

import { useRef, useState } from "react";
import { Check, ChevronRight, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export type JsonViewerProps = {
  value: unknown;
  name?: string;
  defaultExpandedDepth?: number;
  chunkSize?: number;
  className?: string;
};

type JsonKind =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "array"
  | "object"
  | "other";

function kindOf(value: unknown): JsonKind {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
    case "bigint":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    default:
      return "other";
  }
}

const VALUE_CLASS: Record<JsonKind, string> = {
  string: "text-[#98c379]",
  number: "text-[#d19a66]",
  boolean: "text-[#c678dd]",
  null: "text-faint",
  array: "text-channel",
  object: "text-channel",
  other: "text-channel",
};

function stringify(value: unknown) {
  try {
    return JSON.stringify(
      value,
      (_key, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
  } catch {
    return String(value);
  }
}

function CopyButton({ value, label }: { value: unknown; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void navigator.clipboard?.writeText(stringify(value));
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded p-0.5 text-channel opacity-0 transition-opacity group-hover/json-row:opacity-100 hover:bg-hover hover:text-interactive-hover focus-visible:opacity-100"
    >
      {copied ? (
        <Check className="size-3.5 text-positive" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

function Primitive({ value }: { value: unknown }) {
  const kind = kindOf(value);
  const [expanded, setExpanded] = useState(false);

  if (kind === "string") {
    const text = value as string;
    const long = text.length > 220;
    const shown = long && !expanded ? `${text.slice(0, 220)}…` : text;
    return (
      <span className={cn("break-all", VALUE_CLASS.string)}>
        &quot;{shown}&quot;
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1.5 rounded bg-hover px-1 text-[11px] text-channel hover:text-interactive-hover"
          >
            {expanded ? "less" : `+${text.length - 220}`}
          </button>
        ) : null}
      </span>
    );
  }

  if (kind === "null") {
    return (
      <span className={VALUE_CLASS.null}>
        {value === undefined ? "undefined" : "null"}
      </span>
    );
  }

  return <span className={VALUE_CLASS[kind]}>{String(value)}</span>;
}

type NodeProps = {
  label: string | null;
  value: unknown;
  depth: number;
  expandedDepth: number;
  chunkSize: number;
  isLast: boolean;
};

function JsonNode({
  label,
  value,
  depth,
  expandedDepth,
  chunkSize,
  isLast,
}: NodeProps) {
  const kind = kindOf(value);
  const branch = kind === "array" || kind === "object";
  const [open, setOpen] = useState(depth < expandedDepth);
  const [shown, setShown] = useState(chunkSize);

  const entries: [string, unknown][] = branch
    ? kind === "array"
      ? (value as unknown[]).map((v, i) => [String(i), v])
      : Object.entries(value as Record<string, unknown>)
    : [];

  const count = entries.length;
  const visible = entries.slice(0, shown);
  const remaining = count - visible.length;

  const key = label === null ? null : (
    <span className="text-mention-fg">{label}</span>
  );

  if (!branch) {
    return (
      <div className="group/json-row flex items-start gap-1.5 rounded pl-[18px] hover:bg-hover">
        {key ? (
          <span className="shrink-0">
            {key}
            <span className="text-channel">: </span>
          </span>
        ) : null}
        <Primitive value={value} />
        {!isLast ? <span className="text-channel">,</span> : null}
        <span className="ml-auto shrink-0 pl-2">
          <CopyButton value={value} label="Copy value" />
        </span>
      </div>
    );
  }

  const summary =
    kind === "array" ? `Array(${count})` : `Object(${count})`;
  const openBrace = kind === "array" ? "[" : "{";
  const closeBrace = kind === "array" ? "]" : "}";

  return (
    <div>
      <div className="group/json-row flex items-center gap-1 rounded hover:bg-hover">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
        >
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-channel transition-transform",
              open && "rotate-90",
            )}
          />
          {key ? (
            <span className="shrink-0">
              {key}
              <span className="text-channel">: </span>
            </span>
          ) : null}
          <span className="truncate text-channel">
            {open ? openBrace : `${openBrace}…${closeBrace} ${summary}`}
          </span>
        </button>
        <CopyButton value={value} label="Copy subtree" />
      </div>
      {open ? (
        <>
          <div className="ml-[7px] border-l border-divider pl-3">
            {visible.map(([childKey, childValue], index) => (
              <JsonNode
                key={childKey}
                label={childKey}
                value={childValue}
                depth={depth + 1}
                expandedDepth={expandedDepth}
                chunkSize={chunkSize}
                isLast={index === count - 1}
              />
            ))}
            {remaining > 0 ? (
              <button
                type="button"
                onClick={() => setShown((v) => v + chunkSize)}
                className="my-0.5 ml-[18px] rounded bg-hover px-1.5 py-0.5 text-[11px] text-channel hover:bg-active hover:text-interactive-hover"
              >
                Show {Math.min(remaining, chunkSize)} more ({remaining} hidden)
              </button>
            ) : null}
          </div>
          <div className="pl-[18px] text-channel">
            {closeBrace}
            {!isLast ? "," : ""}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function JsonViewer({
  value,
  name,
  defaultExpandedDepth = 1,
  chunkSize = 50,
  className,
}: JsonViewerProps) {
  return (
    <div
      className={cn(
        "scrollbar-discord overflow-auto rounded-md border border-code-border bg-code p-2 font-mono text-[13px] leading-[1.6] text-normal",
        className,
      )}
    >
      <JsonNode
        label={name ?? null}
        value={value}
        depth={0}
        expandedDepth={defaultExpandedDepth}
        chunkSize={chunkSize}
        isLast
      />
    </div>
  );
}
