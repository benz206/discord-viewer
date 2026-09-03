"use client";

import { useState } from "react";

import { JsonViewer } from "@/components/common/json-viewer";
import { cn } from "@/lib/utils";

export interface RawFile {
  name: string;
  path: string;
  value: unknown;
}

export function RawFiles({ files }: { files: RawFile[] }) {
  const [active, setActive] = useState(files[0]?.name ?? "");
  if (files.length === 0) return null;
  const current = files.find((file) => file.name === active) ?? files[0];

  return (
    <div>
      <div role="tablist" className="mb-3 flex flex-wrap gap-1 border-b border-divider">
        {files.map((file) => (
          <button
            key={file.name}
            type="button"
            role="tab"
            aria-selected={file.name === current.name}
            onClick={() => setActive(file.name)}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 font-mono text-[13px] transition-colors",
              file.name === current.name
                ? "border-brand text-header"
                : "border-transparent text-channel hover:text-interactive-hover",
            )}
          >
            {file.name}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-mono text-faint">{current.path}</span>
        <a href={`/api/asset/${current.path}`} download className="text-link hover:underline">
          Download
        </a>
        <a
          href={`/api/asset/${current.path}`}
          target="_blank"
          rel="noreferrer"
          className="text-link hover:underline"
        >
          Open raw
        </a>
      </div>

      <JsonViewer value={current.value} name={current.name} defaultExpandedDepth={1} className="max-h-[640px]" />
    </div>
  );
}
