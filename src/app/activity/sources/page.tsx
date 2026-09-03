import Link from "next/link";
import { AlertTriangle, Download, FileJson2 } from "lucide-react";

import { getActivitySources } from "@/lib/data/meta";
import { getActivityDaily, listActivityDomains } from "@/lib/data/activity";
import { DOMAIN_NOTES, domainColor, sortDomains } from "@/components/activity/domains";
import { formatBytes, formatCount, formatDay } from "@/components/activity/format";
import { activityHref } from "@/components/activity/query";

const LARGE_FILE_BYTES = 200 * 1024 * 1024;

export default function ActivitySourcesPage() {
  const sources = sortDomains(getActivitySources());
  const domains = new Map(listActivityDomains().map((domain) => [domain.domain, domain]));

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <FileJson2 className="size-5 shrink-0 text-channel" />
        <h1 className="shrink-0 text-base leading-5 font-semibold text-header">Source files</h1>
        <span aria-hidden className="h-6 w-px shrink-0 bg-divider" />
        <p className="min-w-0 flex-1 truncate text-sm text-channel">
          Newline-delimited JSON, one event per line — indexed by byte offset
        </p>
      </header>

      <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-4 p-4">
          {sources.map((source) => {
            const stats = domains.get(source.domain);
            const days = getActivityDaily({ domain: source.domain });
            const unparsed = source.lines - (stats?.count ?? 0);
            return (
              <section
                key={source.domain}
                className="space-y-3 rounded-md border border-divider bg-surface-2 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: domainColor(source.domain) }}
                  />
                  <h2 className="text-base font-semibold text-header">{source.domain}</h2>
                  <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] text-channel tabular-nums">
                    {formatBytes(source.bytes)}
                  </span>
                  <Link
                    href={activityHref({ domain: source.domain })}
                    className="ml-auto text-[13px] text-link hover:underline"
                  >
                    Browse events
                  </Link>
                </div>

                <p className="text-[13px] text-channel">{DOMAIN_NOTES[source.domain]}</p>

                <div className="grid gap-3 text-[13px] sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] font-semibold tracking-wide text-faint uppercase">Lines</div>
                    <div className="text-normal tabular-nums">{formatCount(source.lines)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold tracking-wide text-faint uppercase">Indexed</div>
                    <div className="text-normal tabular-nums">
                      {formatCount(stats?.count ?? 0)}
                      {unparsed > 0 ? (
                        <span className="text-warning"> ({formatCount(unparsed)} unparsed)</span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold tracking-wide text-faint uppercase">First day</div>
                    <div className="text-normal tabular-nums">{formatDay(days[0]?.day ?? null)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold tracking-wide text-faint uppercase">Last day</div>
                    <div className="text-normal tabular-nums">
                      {formatDay(days[days.length - 1]?.day ?? null)}
                    </div>
                  </div>
                </div>

                <div className="rounded bg-surface-3 px-3 py-2 font-mono text-[12px] break-all text-channel">
                  data/package/{source.file}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`/api/asset/${source.file}`}
                    download
                    className="flex h-8 items-center gap-1.5 rounded bg-brand px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover [&_svg]:size-4"
                  >
                    <Download />
                    Download raw file
                  </a>
                  {source.bytes > LARGE_FILE_BYTES ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-warning [&_svg]:size-4">
                      <AlertTriangle />
                      {formatBytes(source.bytes)} — this streams the entire file to your browser
                    </span>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
