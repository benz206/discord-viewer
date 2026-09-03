import {
  AtSign,
  Compass,
  Hash,
  Megaphone,
  MessageSquareText,
  Radio,
  Users,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ChannelKind =
  | "text"
  | "voice"
  | "announcement"
  | "stage"
  | "forum"
  | "media"
  | "thread"
  | "category"
  | "directory"
  | "dm"
  | "group";

export function channelKindFromType(type: number | null | undefined): ChannelKind {
  switch (type) {
    case 1:
      return "dm";
    case 2:
      return "voice";
    case 3:
      return "group";
    case 4:
      return "category";
    case 5:
      return "announcement";
    case 10:
    case 11:
    case 12:
      return "thread";
    case 13:
      return "stage";
    case 14:
      return "directory";
    case 15:
      return "forum";
    case 16:
      return "media";
    default:
      return "text";
  }
}

const ICONS = {
  text: Hash,
  voice: Volume2,
  announcement: Megaphone,
  stage: Radio,
  forum: MessageSquareText,
  media: MessageSquareText,
  thread: MessageSquareText,
  category: Hash,
  directory: Compass,
  dm: AtSign,
  group: Users,
} as const;

export function ChannelIcon({
  kind = "text",
  className,
}: {
  kind?: ChannelKind;
  className?: string;
}) {
  const Icon = ICONS[kind] ?? Hash;
  return <Icon className={cn("size-5 shrink-0", className)} />;
}
