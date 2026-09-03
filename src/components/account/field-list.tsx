import { Fragment } from "react";

import { JsonViewer } from "@/components/common/json-viewer";
import { cn } from "@/lib/utils";
import { BoolValue, Mono } from "@/components/account/section";
import { formatDateTime, formatNumber, humanizeKey, isIsoDate, type Rec } from "@/components/account/format";

export function AutoValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-faint">null</span>;
  if (typeof value === "boolean") return <BoolValue value={value} />;
  if (typeof value === "number") return <Mono>{Number.isInteger(value) ? formatNumber(value) : String(value)}</Mono>;
  if (typeof value === "string") {
    if (value.length === 0) return <span className="text-faint">empty string</span>;
    if (isIsoDate(value)) return <span title={value}>{formatDateTime(value)}</span>;
    return <span className="break-words whitespace-pre-wrap">{value}</span>;
  }
  if (Array.isArray(value) && value.length === 0) return <span className="text-faint">empty list</span>;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Rec).length === 0) {
    return <span className="text-faint">empty object</span>;
  }
  return <JsonViewer value={value} defaultExpandedDepth={1} className="max-h-80" />;
}

export function FieldList({
  value,
  overrides,
  compact,
  className,
}: {
  value: Rec;
  overrides?: Record<string, React.ReactNode>;
  compact?: boolean;
  className?: string;
}) {
  const entries = Object.entries(value);
  if (entries.length === 0) return <p className="text-sm text-faint">No fields.</p>;

  const label = (key: string) => (
    <dt
      title={key}
      className={cn(
        "text-[11px] font-semibold tracking-wide text-channel uppercase",
        compact ? "pb-0.5" : "pt-0.5 sm:text-right",
      )}
    >
      {humanizeKey(key)}
    </dt>
  );

  const body = (key: string, entry: unknown) => (
    <dd className="min-w-0 text-sm text-normal">
      {overrides && key in overrides ? overrides[key] : <AutoValue value={entry} />}
    </dd>
  );

  if (compact) {
    return (
      <dl className={cn("flex flex-col gap-2", className)}>
        {entries.map(([key, entry]) => (
          <div key={key} className="min-w-0">
            {label(key)}
            {body(key, entry)}
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[minmax(9rem,14rem)_minmax(0,1fr)]", className)}>
      {entries.map(([key, entry]) => (
        <Fragment key={key}>
          {label(key)}
          {body(key, entry)}
        </Fragment>
      ))}
    </dl>
  );
}
