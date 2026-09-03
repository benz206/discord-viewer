import Link from "next/link";

import { getChannel } from "@/lib/data/channels";
import { channelKindFromType } from "@/components/layout/channel-icon";
import { ChannelIcon } from "@/components/layout/channel-icon";

export function ChannelRef({
  guildId,
  id,
  name,
  type,
}: {
  guildId: string;
  id: string | null | undefined;
  name?: string | null;
  type?: number | null;
}) {
  if (!id) return <span className="text-faint">—</span>;

  const row = getChannel(id);
  const label = name ?? row?.name ?? row?.indexName ?? id;
  const kind = channelKindFromType(type ?? row?.type ?? 0);
  const inner = (
    <>
      <ChannelIcon kind={kind} className="size-4 text-channel" />
      <span className="min-w-0 truncate">{label}</span>
    </>
  );

  if (row && row.messageCount > 0) {
    return (
      <Link
        href={`/channels/${guildId}/${id}`}
        className="inline-flex min-w-0 max-w-full items-center gap-1 align-middle text-link hover:underline"
        title={id}
      >
        {inner}
      </Link>
    );
  }

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1 align-middle text-subhead" title={id}>
      {inner}
    </span>
  );
}
