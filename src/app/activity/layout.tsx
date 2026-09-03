import { Suspense } from "react";

import { listActivityDomains, listActivityEventTypes } from "@/lib/data/activity";
import { ActivitySidebar } from "@/components/activity/activity-sidebar";

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  const domains = listActivityDomains();
  const types = listActivityEventTypes();
  const totalEvents = domains.reduce((sum, domain) => sum + domain.count, 0);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface text-normal">
      <div className="flex w-60 shrink-0 flex-col bg-surface-2">
        <Suspense fallback={<div className="h-12 shrink-0" />}>
          <ActivitySidebar domains={domains} types={types} totalEvents={totalEvents} />
        </Suspense>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">{children}</div>
    </div>
  );
}
