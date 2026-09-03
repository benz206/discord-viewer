import { JsonViewer } from "@/components/common/json-viewer";

export function RawDetails({
  label = "Raw JSON",
  value,
  name,
}: {
  label?: string;
  value: unknown;
  name?: string;
}) {
  return (
    <details className="mt-4 rounded-lg bg-surface-2">
      <summary className="cursor-pointer list-none px-4 py-2 text-xs font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
        {label}
      </summary>
      <div className="px-4 pb-4">
        <JsonViewer value={value} name={name} defaultExpandedDepth={1} className="max-h-[520px]" />
      </div>
    </details>
  );
}
