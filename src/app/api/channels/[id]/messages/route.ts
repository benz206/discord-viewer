import { getChannel } from "@/lib/data/channels";
import { getMessages } from "@/lib/data/messages";
import { buildResolverMap } from "@/lib/resolvers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const query = new URL(request.url).searchParams;

  const requested = Number(query.get("limit"));
  const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 50, 1), 200);
  const before = query.get("before") ?? undefined;
  const after = query.get("after") ?? undefined;

  const channel = getChannel(id);
  if (!channel) {
    return Response.json({ error: "Unknown channel" }, { status: 404 });
  }

  const page = getMessages(id, { before, after, limit });
  const messages = page.messages.slice().reverse();

  return Response.json(
    {
      messages,
      hasMore: page.messages.length === limit,
      resolvers: buildResolverMap(
        messages.map((message) => message.contents),
        channel.guildId,
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
