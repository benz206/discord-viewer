export type PermissionCategory =
  | "General"
  | "Membership"
  | "Text"
  | "Voice"
  | "Events"
  | "Advanced";

export interface PermissionBit {
  bit: number;
  flag: string;
  label: string;
  category: PermissionCategory;
}

export const PERMISSION_BITS: PermissionBit[] = [
  { bit: 0, flag: "CREATE_INSTANT_INVITE", label: "Create Invite", category: "Membership" },
  { bit: 1, flag: "KICK_MEMBERS", label: "Kick Members", category: "Membership" },
  { bit: 2, flag: "BAN_MEMBERS", label: "Ban Members", category: "Membership" },
  { bit: 3, flag: "ADMINISTRATOR", label: "Administrator", category: "Advanced" },
  { bit: 4, flag: "MANAGE_CHANNELS", label: "Manage Channels", category: "General" },
  { bit: 5, flag: "MANAGE_GUILD", label: "Manage Server", category: "General" },
  { bit: 6, flag: "ADD_REACTIONS", label: "Add Reactions", category: "Text" },
  { bit: 7, flag: "VIEW_AUDIT_LOG", label: "View Audit Log", category: "General" },
  { bit: 8, flag: "PRIORITY_SPEAKER", label: "Priority Speaker", category: "Voice" },
  { bit: 9, flag: "STREAM", label: "Video", category: "Voice" },
  { bit: 10, flag: "VIEW_CHANNEL", label: "View Channels", category: "General" },
  { bit: 11, flag: "SEND_MESSAGES", label: "Send Messages", category: "Text" },
  { bit: 12, flag: "SEND_TTS_MESSAGES", label: "Send Text-to-Speech Messages", category: "Text" },
  { bit: 13, flag: "MANAGE_MESSAGES", label: "Manage Messages", category: "Text" },
  { bit: 14, flag: "EMBED_LINKS", label: "Embed Links", category: "Text" },
  { bit: 15, flag: "ATTACH_FILES", label: "Attach Files", category: "Text" },
  { bit: 16, flag: "READ_MESSAGE_HISTORY", label: "Read Message History", category: "Text" },
  { bit: 17, flag: "MENTION_EVERYONE", label: "Mention @everyone, @here and All Roles", category: "Text" },
  { bit: 18, flag: "USE_EXTERNAL_EMOJIS", label: "Use External Emoji", category: "Text" },
  { bit: 19, flag: "VIEW_GUILD_INSIGHTS", label: "View Server Insights", category: "General" },
  { bit: 20, flag: "CONNECT", label: "Connect", category: "Voice" },
  { bit: 21, flag: "SPEAK", label: "Speak", category: "Voice" },
  { bit: 22, flag: "MUTE_MEMBERS", label: "Mute Members", category: "Voice" },
  { bit: 23, flag: "DEAFEN_MEMBERS", label: "Deafen Members", category: "Voice" },
  { bit: 24, flag: "MOVE_MEMBERS", label: "Move Members", category: "Voice" },
  { bit: 25, flag: "USE_VAD", label: "Use Voice Activity", category: "Voice" },
  { bit: 26, flag: "CHANGE_NICKNAME", label: "Change Nickname", category: "Membership" },
  { bit: 27, flag: "MANAGE_NICKNAMES", label: "Manage Nicknames", category: "Membership" },
  { bit: 28, flag: "MANAGE_ROLES", label: "Manage Roles", category: "General" },
  { bit: 29, flag: "MANAGE_WEBHOOKS", label: "Manage Webhooks", category: "General" },
  { bit: 30, flag: "MANAGE_GUILD_EXPRESSIONS", label: "Manage Expressions", category: "General" },
  { bit: 31, flag: "USE_APPLICATION_COMMANDS", label: "Use Application Commands", category: "Advanced" },
  { bit: 32, flag: "REQUEST_TO_SPEAK", label: "Request to Speak", category: "Events" },
  { bit: 33, flag: "MANAGE_EVENTS", label: "Manage Events", category: "Events" },
  { bit: 34, flag: "MANAGE_THREADS", label: "Manage Threads", category: "Text" },
  { bit: 35, flag: "CREATE_PUBLIC_THREADS", label: "Create Public Threads", category: "Text" },
  { bit: 36, flag: "CREATE_PRIVATE_THREADS", label: "Create Private Threads", category: "Text" },
  { bit: 37, flag: "USE_EXTERNAL_STICKERS", label: "Use External Stickers", category: "Text" },
  { bit: 38, flag: "SEND_MESSAGES_IN_THREADS", label: "Send Messages in Threads", category: "Text" },
  { bit: 39, flag: "USE_EMBEDDED_ACTIVITIES", label: "Use Activities", category: "Voice" },
  { bit: 40, flag: "MODERATE_MEMBERS", label: "Timeout Members", category: "Membership" },
  { bit: 41, flag: "VIEW_CREATOR_MONETIZATION_ANALYTICS", label: "View Creator Analytics", category: "Advanced" },
  { bit: 42, flag: "USE_SOUNDBOARD", label: "Use Soundboard", category: "Voice" },
  { bit: 43, flag: "CREATE_GUILD_EXPRESSIONS", label: "Create Expressions", category: "General" },
  { bit: 44, flag: "CREATE_EVENTS", label: "Create Events", category: "Events" },
  { bit: 45, flag: "USE_EXTERNAL_SOUNDS", label: "Use External Sounds", category: "Voice" },
  { bit: 46, flag: "SEND_VOICE_MESSAGES", label: "Send Voice Messages", category: "Text" },
  { bit: 47, flag: "USE_CLYDE_AI", label: "Use Clyde AI", category: "Advanced" },
  { bit: 48, flag: "SET_VOICE_CHANNEL_STATUS", label: "Set Voice Channel Status", category: "Voice" },
  { bit: 49, flag: "SEND_POLLS", label: "Create Polls", category: "Text" },
  { bit: 50, flag: "USE_EXTERNAL_APPS", label: "Use External Apps", category: "Advanced" },
  { bit: 51, flag: "PIN_MESSAGES", label: "Pin Messages", category: "Text" },
];

export const PERMISSION_CATEGORY_ORDER: PermissionCategory[] = [
  "General",
  "Membership",
  "Text",
  "Voice",
  "Events",
  "Advanced",
];

export interface DecodedPermissions {
  raw: string;
  granted: PermissionBit[];
  unknownBits: number[];
  administrator: boolean;
}

export function decodePermissions(value: string | number | null | undefined): DecodedPermissions {
  const raw = value === null || value === undefined ? "0" : String(value);
  let bits: bigint;
  try {
    bits = BigInt(raw);
  } catch {
    return { raw, granted: [], unknownBits: [], administrator: false };
  }

  const granted: PermissionBit[] = [];
  for (const permission of PERMISSION_BITS) {
    if ((bits >> BigInt(permission.bit)) & BigInt(1)) granted.push(permission);
  }

  const known = PERMISSION_BITS.reduce((mask, permission) => mask | (BigInt(1) << BigInt(permission.bit)), BigInt(0));
  const leftover = bits & ~known;
  const unknownBits: number[] = [];
  for (let bit = 0; bit < 64; bit++) {
    if ((leftover >> BigInt(bit)) & BigInt(1)) unknownBits.push(bit);
  }

  return {
    raw,
    granted,
    unknownBits,
    administrator: granted.some((permission) => permission.flag === "ADMINISTRATOR"),
  };
}

export function groupPermissions(permissions: PermissionBit[]): Array<[PermissionCategory, PermissionBit[]]> {
  return PERMISSION_CATEGORY_ORDER.map(
    (category) => [category, permissions.filter((permission) => permission.category === category)] as const,
  ).filter((entry): entry is [PermissionCategory, PermissionBit[]] => entry[1].length > 0);
}

export const VERIFICATION_LEVELS: Record<number, string> = {
  0: "None — unrestricted",
  1: "Low — verified email",
  2: "Medium — registered for 5 minutes",
  3: "High — member for 10 minutes",
  4: "Highest — verified phone",
};

export const EXPLICIT_CONTENT_FILTERS: Record<number, string> = {
  0: "Do not scan any media content",
  1: "Scan media from members without a role",
  2: "Scan media from all members",
};

export const MESSAGE_NOTIFICATION_LEVELS: Record<number, string> = {
  0: "All messages",
  1: "Only @mentions",
};

export const MFA_LEVELS: Record<number, string> = {
  0: "None",
  1: "Elevated — 2FA required for moderation",
};

export const NSFW_LEVELS: Record<number, string> = {
  0: "Default",
  1: "Explicit",
  2: "Safe",
  3: "Age restricted",
};

export const PREMIUM_TIERS: Record<number, string> = {
  0: "No boost level",
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
};

export const SYSTEM_CHANNEL_FLAGS: Array<{ bit: number; label: string }> = [
  { bit: 0, label: "Suppress join notifications" },
  { bit: 1, label: "Suppress boost notifications" },
  { bit: 2, label: "Suppress server setup tips" },
  { bit: 3, label: "Suppress join notification replies" },
  { bit: 4, label: "Suppress role subscription purchase notifications" },
  { bit: 5, label: "Suppress role subscription purchase notification replies" },
];

export const CHANNEL_FLAGS: Array<{ bit: number; label: string }> = [
  { bit: 1, label: "Pinned in forum" },
  { bit: 4, label: "Requires tag" },
  { bit: 15, label: "Hide media download options" },
];

export function decodeFlags(value: number | null | undefined, table: Array<{ bit: number; label: string }>) {
  if (!value) return [];
  return table.filter((flag) => (value & (1 << flag.bit)) !== 0).map((flag) => flag.label);
}

export const GUILD_FEATURE_LABELS: Record<string, string> = {
  ANIMATED_BANNER: "Animated banner",
  ANIMATED_ICON: "Animated icon",
  APPLICATION_COMMAND_PERMISSIONS_V2: "Application command permissions v2",
  AUTO_MODERATION: "AutoMod",
  BANNER: "Banner",
  COMMUNITY: "Community server",
  CREATOR_MONETIZABLE_PROVISIONAL: "Creator monetization",
  CREATOR_STORE_PAGE: "Creator store page",
  DEVELOPER_SUPPORT_SERVER: "Developer support server",
  DISCOVERABLE: "Server discovery",
  FEATURABLE: "Featurable",
  INVITE_SPLASH: "Invite splash",
  INVITES_DISABLED: "Invites disabled",
  MEMBER_VERIFICATION_GATE_ENABLED: "Membership screening",
  MORE_STICKERS: "More sticker slots",
  MORE_EMOJI: "More emoji slots",
  NEWS: "Announcement channels",
  PARTNERED: "Discord Partner",
  PREVIEW_ENABLED: "Preview enabled",
  PRIVATE_THREADS: "Private threads",
  RAID_ALERTS_DISABLED: "Raid alerts disabled",
  ROLE_ICONS: "Role icons",
  ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE: "Role subscriptions purchasable",
  ROLE_SUBSCRIPTIONS_ENABLED: "Role subscriptions enabled",
  TICKETED_EVENTS_ENABLED: "Ticketed events",
  VANITY_URL: "Vanity URL",
  VERIFIED: "Verified",
  VIP_REGIONS: "VIP voice regions",
  WELCOME_SCREEN_ENABLED: "Welcome screen",
  THREE_DAY_THREAD_ARCHIVE: "3 day thread archive",
  SEVEN_DAY_THREAD_ARCHIVE: "7 day thread archive",
  TEXT_IN_VOICE_ENABLED: "Text in voice",
  THREADS_ENABLED: "Threads",
  NEW_THREAD_PERMISSIONS: "New thread permissions",
};

export const WEBHOOK_TYPES: Record<number, string> = {
  1: "Incoming",
  2: "Channel Follower",
  3: "Application",
};

export const OVERWRITE_TYPES: Record<number, string> = {
  0: "Role",
  1: "Member",
};

export const AUTO_ARCHIVE_DURATIONS: Record<number, string> = {
  60: "1 hour",
  1440: "24 hours",
  4320: "3 days",
  10080: "1 week",
};

export const SORT_ORDERS: Record<number, string> = {
  0: "Latest activity",
  1: "Creation date",
};

export const USER_SOURCE_LABELS: Record<string, string> = {
  account: "Account owner",
  application_bot: "Application bot",
  audit_log: "Audit log",
  ban: "Ban",
  dm_channel: "DM",
  emoji_uploader: "Emoji uploader",
  group_dm_recipient: "Group DM",
  guild_owner: "Guild owner",
  note: "Note",
  relationship: "Relationship",
  webhook: "Webhook",
  webhook_application: "Webhook application",
};
