import type { GuildDetail } from "@/lib/data/types";

export interface GuildPerson {
  id: string;
  reasons: string[];
}

export function guildPeople(guild: GuildDetail): GuildPerson[] {
  const people = new Map<string, Set<string>>();
  const add = (id: string | null | undefined, reason: string) => {
    if (!id || !/^\d+$/.test(id)) return;
    const reasons = people.get(id) ?? new Set<string>();
    reasons.add(reason);
    people.set(id, reasons);
  };

  add(guild.ownerId ?? guild.guild?.owner_id, "Owner");
  for (const ban of guild.bans ?? []) add(ban.user_id, "Banned");
  for (const entry of guild.auditLog ?? []) {
    add(entry.user_id, "Audit log actor");
    add(entry.target_id, "Audit log target");
  }
  for (const emoji of guild.emoji ?? []) add(emoji.user_id, "Emoji uploader");
  for (const webhook of guild.webhooks ?? []) add(webhook.application_id, "Webhook application");
  for (const channel of guild.channels ?? []) {
    for (const overwrite of channel.permission_overwrites ?? []) {
      if (overwrite.type === 1) add(overwrite.id, "Channel permission overwrite");
    }
  }

  return [...people.entries()]
    .map(([id, reasons]) => ({ id, reasons: [...reasons].sort() }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}
