import { getActivityEvent } from "@/lib/data/activity";
import { effectiveIds } from "@/components/activity/context";
import { resolveActivityContext } from "@/app/activity/resolve-context";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric < 1) {
    return Response.json({ error: "Invalid event id" }, { status: 400 });
  }

  const found = getActivityEvent(numeric);
  if (!found) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  const ids = effectiveIds(found.event, found.raw);
  return Response.json({
    event: found.event,
    raw: found.raw,
    context: resolveActivityContext([{ ...found.event, ...ids }]),
  });
}
