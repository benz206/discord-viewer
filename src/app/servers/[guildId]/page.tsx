import { redirect } from "next/navigation";

export default async function GuildSettingsIndex({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  redirect(`/servers/${guildId}/overview`);
}
