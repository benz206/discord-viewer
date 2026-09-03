import { cn } from "@/lib/utils";

export interface DefinitionField {
  key: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  mono?: boolean;
}

export function DefinitionList({ fields, className }: { fields: DefinitionField[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-divider overflow-hidden rounded-lg bg-surface-2", className)}>
      {fields.map((field) => (
        <div key={field.key} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[220px_1fr] sm:gap-4">
          <dt className="text-xs font-semibold tracking-wide text-channel uppercase">
            {field.label}
            {field.hint ? <span className="mt-0.5 block text-[11px] normal-case text-faint">{field.hint}</span> : null}
          </dt>
          <dd className={cn("min-w-0 text-sm break-words text-normal", field.mono && "font-mono text-[13px]")}>
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Blank({ children = "—" }: { children?: React.ReactNode }) {
  return <span className="text-faint">{children}</span>;
}

export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px] break-all text-subhead">{children}</span>;
}

export function BoolValue({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) return <Blank />;
  return (
    <span className={value ? "text-positive" : "text-channel"}>{value ? "Yes" : "No"}</span>
  );
}

export function ScalarValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <Blank>null</Blank>;
  if (typeof value === "boolean") return <BoolValue value={value} />;
  if (typeof value === "number" || typeof value === "bigint") return <Mono>{String(value)}</Mono>;
  if (typeof value === "string") return value.length ? <span>{value}</span> : <Blank>empty string</Blank>;
  if (Array.isArray(value) && value.length === 0) return <Blank>empty array</Blank>;
  if (typeof value === "object" && Object.keys(value as object).length === 0) {
    return <Blank>empty object</Blank>;
  }
  return <Mono>{JSON.stringify(value)}</Mono>;
}
