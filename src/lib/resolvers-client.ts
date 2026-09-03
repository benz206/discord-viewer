import type { ChannelKind } from "@/components/layout/channel-icon";
import type { MarkdownResolvers } from "@/components/messages/message-content";

export type ResolverMap = {
  users: Record<string, { name: string; href?: string }>;
  channels: Record<string, { name: string; href?: string; kind?: ChannelKind }>;
  roles: Record<string, { name: string; color?: string | null }>;
};

export const EMPTY_RESOLVER_MAP: ResolverMap = {
  users: {},
  channels: {},
  roles: {},
};

export function mergeResolverMaps(a: ResolverMap, b: ResolverMap): ResolverMap {
  return {
    users: { ...a.users, ...b.users },
    channels: { ...a.channels, ...b.channels },
    roles: { ...a.roles, ...b.roles },
  };
}

export function makeResolvers(map: ResolverMap): MarkdownResolvers {
  return {
    resolveUser: (id) => map.users[id],
    resolveChannel: (id) => map.channels[id],
    resolveRole: (id) => map.roles[id],
  };
}
