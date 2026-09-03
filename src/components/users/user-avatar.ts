export function userAvatarUrl(
  id: string,
  avatar: string | null | undefined,
  discriminator?: string | null,
): string {
  if (avatar) {
    const extension = avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}?size=128`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber(id, discriminator)}.png`;
}

export function defaultAvatarNumber(id: string, discriminator?: string | null): number {
  if (discriminator && discriminator !== "0" && /^\d+$/.test(discriminator)) {
    return Number(discriminator) % 5;
  }
  if (/^\d+$/.test(id)) return Number((BigInt(id) >> BigInt(22)) % BigInt(6));
  return 0;
}

export function userDisplayName(entry: {
  id: string;
  name: string | null;
  discriminator: string | null;
}): string {
  if (!entry.name) return entry.id;
  if (!entry.discriminator || entry.discriminator === "0") return entry.name;
  return `${entry.name}#${entry.discriminator.padStart(4, "0")}`;
}
