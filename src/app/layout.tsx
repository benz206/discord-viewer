import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

import { listGuildsWithChannels } from "@/lib/data/channels";
import { listGuilds } from "@/lib/data/servers";
import { AppGuildRail, type RailGuild } from "@/components/app/app-guild-rail";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Discord Viewer",
  description: "Browse a personal Discord data package",
};

function railGuilds(): RailGuild[] {
  const guilds = listGuilds();
  const lastWithMessages = guilds.findLastIndex((guild) => guild.messageCount > 0);

  const items: RailGuild[] = guilds.map((guild, index) => ({
    id: guild.id,
    name: guild.name,
    iconUrl: guild.iconFile ? `/api/asset/${guild.iconFile}` : null,
    separatorAfter: index === lastWithMessages,
  }));

  const orphans = listGuildsWithChannels({ withMessagesOnly: true }).find(
    (group) => group.kind === "unknown",
  );
  if (orphans) {
    items.push({ id: "unknown", name: "Unsorted Channels", iconUrl: null });
  }
  return items;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${notoSans.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="h-full overflow-hidden">
        <div className="flex h-screen w-full overflow-hidden bg-surface text-normal">
          <AppGuildRail guilds={railGuilds()} />
          {children}
        </div>
      </body>
    </html>
  );
}
