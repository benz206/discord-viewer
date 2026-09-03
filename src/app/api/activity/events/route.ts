import { listActivityEvents } from "@/lib/data/activity";
import { parseActivityQuery } from "@/components/activity/query";
import { listOptionsFor } from "@/app/activity/list-options";
import { resolveActivityContext } from "@/app/activity/resolve-context";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseActivityQuery(Object.fromEntries(url.searchParams));
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Number(url.searchParams.get("limit"));

  const page = listActivityEvents(
    listOptionsFor(query, { cursor, limit: Number.isFinite(limit) && limit > 0 ? limit : undefined }),
  );

  return Response.json({
    events: page.events,
    nextCursor: page.nextCursor,
    context: resolveActivityContext(page.events),
  });
}
