export interface DiscordUserRef {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  avatar_decoration?: string | null;
  public_flags?: number;
  bot?: boolean;
}

export interface Relationship {
  id: string;
  type: number;
  nickname: string | null;
  user: DiscordUserRef;
}

export interface Connection {
  type: string;
  id: string;
  name: string;
  visibility: number;
  friend_sync: boolean;
  show_activity: boolean;
  verified: boolean;
  two_way_link: boolean;
  metadata_visibility: number;
  revoked: boolean;
}

export interface UserSession {
  id_hash: string;
  user_data: {
    version: number;
    creation_time: string;
    expiration_time: string;
    approx_last_used_time?: string;
    is_mfa?: boolean;
    is_bot?: boolean;
    client_info?: { ip?: string; os?: string; platform?: string };
    extra_tokens?: unknown;
  };
  is_soft_deleted: boolean;
}

export interface Payment {
  id: string;
  created_at: string;
  currency: string;
  tax: number;
  tax_inclusive: boolean;
  amount: number;
  amount_refunded: number;
  status: number;
  description: string;
  flags: number;
  subscription?: Record<string, unknown> | null;
  payment_source?: PaymentSource | null;
  sku_id?: string;
  sku_price?: number;
  sku_subscription_plan_id?: string;
}

export interface PaymentSource {
  id: string;
  type: number;
  invalid: boolean;
  flags: number;
  screen_status?: number;
  payment_gateway?: number | null;
  email?: string;
  billing_address?: {
    name: string;
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  country?: string;
  brand?: string;
  last_4?: string;
}

export interface GuildSetting {
  guild_id: string | null;
  suppress_everyone: boolean;
  suppress_roles: boolean;
  mute_scheduled_events: boolean;
  message_notifications: number;
  flags: number;
  mobile_push: boolean;
  muted: boolean;
  mute_config: unknown;
  hide_muted_channels: boolean;
  channel_overrides: Array<{
    channel_id: string;
    message_notifications?: number;
    muted?: boolean;
    mute_config?: unknown;
    collapsed?: boolean;
    flags?: number;
  }>;
  notify_highlights?: number;
  version?: number;
}

export interface Entitlement {
  id: string;
  sku_id: string;
  application_id: string;
  user_id: string;
  promotion_id: string | null;
  type: number;
  deleted: boolean;
  gift_code_flags: number;
  sku_name?: string;
  consumed?: boolean;
  gifter_user_id?: string;
  subscription_plan?: {
    id: string;
    name: string;
    interval: number;
    interval_count: number;
    tax_inclusive: boolean;
    sku_id: string;
  };
  parent_id?: string;
}

export interface ActivityApplicationStatistic {
  application_id: string;
  last_played_at: string;
  total_duration: number;
  total_discord_sku_duration: number;
}

export interface AccountUser {
  id: string;
  username: string;
  /** Dropped once Discord retired discriminators in favour of global_name. */
  discriminator?: number;
  global_name?: string | null;
  email: string;
  verified: boolean;
  avatar_hash: string | null;
  has_mobile: boolean;
  needs_email_verification: boolean;
  premium_until: string | null;
  /** A bitfield in older packages; current ones export an array of flag names. */
  flags: number | string[];
  phone: string | null;
  temp_banned_until: string | null;
  ip: string;
  settings: { settings?: Record<string, unknown>; [key: string]: unknown };
  connections: Connection[];
  external_friends_lists: unknown[];
  friend_suggestions: unknown[];
  user_sessions: UserSession[];
  relationships: Relationship[];
  guild_settings: GuildSetting[];
  library_applications: unknown[];
  user_activity_application_statistics: ActivityApplicationStatistic[];
  notes: Record<string, string>;
  user_profile_metadata: Record<string, unknown>;
  // Newer packages moved these three into account/user_data_exports/discord_billing.
  payments?: Payment[];
  payment_sources?: PaymentSource[];
  entitlements?: Entitlement[];
  // Added by newer packages.
  application_user_role_connections?: ApplicationRoleConnection[];
  lobby_members?: unknown[];
  current_orbs_balance?: number;
  user_achievements?: unknown[];
}

export interface ApplicationRoleConnection {
  platform_name: string | null;
  platform_username: string | null;
  metadata: Record<string, unknown>;
  application_id: string;
}

export interface Application {
  id: string;
  name: string;
  icon: string | null;
  description: string;
  summary: string;
  type: number | null;
  hook: boolean;
  bot_public: boolean;
  bot_require_code_grant: boolean;
  verify_key: string;
  flags: number;
  redirect_uris: string[];
  rpc_application_state: number;
  store_application_state: number;
  verification_state: number;
  interactions_endpoint_url: string | null;
  integration_public: boolean;
  integration_require_code_grant: boolean;
  discoverability_state: number;
  discovery_eligibility_flags: number;
  install_params?: { scopes: string[]; permissions: string };
  tags?: string[];
  bot?: DiscordUserRef;
}

export interface ApplicationEntry {
  application: Application;
  iconPath: string | null;
  botAvatarPath: string | null;
}

export interface GuildRole {
  id: string;
  name: string;
  permissions: string;
  position: number;
  color: number;
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  icon: string | null;
  unicode_emoji: string | null;
  flags: number;
}

export interface GuildJson {
  id: string;
  name: string;
  owner_id?: string;
  icon_hash?: string | null;
  banner_hash?: string | null;
  splash_hash?: string | null;
  discovery_splash_hash?: string | null;
  description?: string | null;
  region?: string | null;
  custom_regions?: unknown;
  features?: string[];
  roles?: Record<string, GuildRole>;
  afk_channel_id?: string | null;
  afk_timeout?: number;
  application_id?: string | null;
  default_message_notifications?: number;
  emoji_rev?: string | null;
  sticker_rev?: string | null;
  explicit_content_filter?: number;
  max_members?: number;
  max_presences?: number | null;
  mfa_level?: number;
  preferred_locale?: string;
  public_updates_channel_id?: string | null;
  rules_channel_id?: string | null;
  system_channel_flags?: number;
  system_channel_id?: string | null;
  vanity_url_code?: string | null;
  verification_level?: number;
  widget_channel_id?: string | null;
  widget_enabled?: boolean;
  data?: unknown;
}

export interface PermissionOverwrite {
  id: string;
  type: number;
  allow: string;
  deny: string;
}

export interface GuildChannelJson {
  id: string;
  type: number;
  name: string;
  position: number;
  flags: number;
  parent_id: string | null;
  permission_overwrites: PermissionOverwrite[];
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: string | null;
  last_pin_timestamp?: string | null;
  rate_limit_per_user?: number;
  default_thread_rate_limit_per_user?: number;
  bitrate?: number;
  user_limit?: number;
  rtc_region?: string | null;
  available_tags?: unknown[];
  default_reaction_emoji?: unknown;
  default_sort_order?: number | null;
  default_auto_archive_duration?: number;
  template?: string;
}

export interface AuditLogChange {
  key: string;
  new_value?: unknown;
  old_value?: unknown;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action_type: number;
  changes: AuditLogChange[];
  target_id?: string | null;
  options?: Record<string, unknown>;
  reason?: string | null;
}

export interface GuildBan {
  user_id: string;
  reason: string | null;
}

export interface GuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  available: boolean;
  managed: boolean;
  require_colons: boolean;
  roles: string[];
  user_id?: string;
}

export interface GuildWebhook {
  id: string;
  type: number;
  name: string;
  avatar: string | null;
  channel_id: string;
  guild_id: string;
  application_id: string | null;
  source_channel?: { id: string; name: string };
  source_guild?: { id: string; name: string; icon: string | null };
}

export interface PackageChannelJson {
  id: string;
  type: number;
  name?: string;
  icon_hash?: string;
  recipients?: string[];
  guild?: { id: string; name: string };
}

export interface ChannelRow {
  id: string;
  name: string | null;
  type: number;
  guildId: string | null;
  guildName: string | null;
  indexName: string | null;
  recipients: string[] | null;
  messageCount: number;
  firstTs: number | null;
  lastTs: number | null;
}

export interface GuildRow {
  id: string;
  name: string;
  ownerId: string | null;
  iconFile: string | null;
  hasGuildJson: boolean;
  hasChannels: boolean;
  hasAuditLog: boolean;
  hasBans: boolean;
  hasEmoji: boolean;
  hasWebhooks: boolean;
  roleCount: number;
  channelCount: number;
  emojiCount: number;
  banCount: number;
  webhookCount: number;
  auditLogCount: number;
  messageChannelCount: number;
  messageCount: number;
}

export interface GuildDetail extends GuildRow {
  guild: GuildJson | null;
  channels: GuildChannelJson[] | null;
  auditLog: AuditLogEntry[] | null;
  bans: GuildBan[] | null;
  emoji: GuildEmoji[] | null;
  webhooks: GuildWebhook[] | null;
  assets: GuildAssets;
}

export interface GuildAssets {
  icon: string | null;
  emoji: Array<{ id: string; path: string }>;
  webhookAvatars: Array<{ hash: string; path: string }>;
}

export interface MessageRow {
  id: string;
  channelId: string;
  ts: number;
  contents: string;
  attachments: string[];
  cursor: string;
}

export interface MessagePage {
  messages: MessageRow[];
  nextCursor: string | null;
  prevCursor: string | null;
}

export interface SearchHit extends MessageRow {
  snippet: string;
  channelName: string | null;
  guildId: string | null;
  guildName: string | null;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
}

export interface DayCount {
  day: string;
  count: number;
}

export interface ActivityEventTypeRow {
  domain: string;
  eventType: string;
  count: number;
  firstTs: number | null;
  lastTs: number | null;
  activeDays: number;
}

export interface ActivityEventRow {
  id: number;
  domain: string;
  eventType: string;
  ts: number | null;
  day: string | null;
  guildId: string | null;
  channelId: string | null;
  messageId: string | null;
  summary: Record<string, string | number | boolean>;
}

export interface ActivityEventPage {
  events: ActivityEventRow[];
  nextCursor: string | null;
}

export interface UserDirectoryEntry {
  id: string;
  name: string | null;
  discriminator: string | null;
  avatar: string | null;
  note: string | null;
  sources: string[];
}

export interface MessageCountByGuild {
  kind: "guild" | "dm" | "group_dm" | "unknown";
  guildId: string | null;
  guildName: string | null;
  count: number;
}

export interface PackageStats {
  channelCount: number;
  dmChannelCount: number;
  groupDmChannelCount: number;
  guildChannelCount: number;
  messageCount: number;
  guildCount: number;
  activityEventCount: number;
  activityEventTypeCount: number;
  /** Files under account/user_data_exports; absent from indexes built before it existed. */
  dataExportFileCount?: number;
  userCount: number;
  firstMessageTs: number | null;
  lastMessageTs: number | null;
  firstActivityTs: number | null;
  lastActivityTs: number | null;
  ingestedAt: string;
  ingestSeconds: number;
}

export interface ResolvedAsset {
  absolutePath: string;
  relativePath: string;
  mimeType: string;
  size: number;
}

export const CHANNEL_TYPES: Record<number, string> = {
  0: "Text",
  1: "DM",
  2: "Voice",
  3: "Group DM",
  4: "Category",
  5: "Announcement",
  6: "Store",
  10: "Announcement Thread",
  11: "Public Thread",
  12: "Private Thread",
  13: "Stage",
  14: "Directory",
  15: "Forum",
  16: "Media",
};

export const AUDIT_LOG_ACTIONS: Record<number, string> = {
  1: "GUILD_UPDATE",
  10: "CHANNEL_CREATE",
  11: "CHANNEL_UPDATE",
  12: "CHANNEL_DELETE",
  13: "CHANNEL_OVERWRITE_CREATE",
  14: "CHANNEL_OVERWRITE_UPDATE",
  15: "CHANNEL_OVERWRITE_DELETE",
  20: "MEMBER_KICK",
  21: "MEMBER_PRUNE",
  22: "MEMBER_BAN_ADD",
  23: "MEMBER_BAN_REMOVE",
  24: "MEMBER_UPDATE",
  25: "MEMBER_ROLE_UPDATE",
  26: "MEMBER_MOVE",
  27: "MEMBER_DISCONNECT",
  28: "BOT_ADD",
  30: "ROLE_CREATE",
  31: "ROLE_UPDATE",
  32: "ROLE_DELETE",
  40: "INVITE_CREATE",
  41: "INVITE_UPDATE",
  42: "INVITE_DELETE",
  50: "WEBHOOK_CREATE",
  51: "WEBHOOK_UPDATE",
  52: "WEBHOOK_DELETE",
  60: "EMOJI_CREATE",
  61: "EMOJI_UPDATE",
  62: "EMOJI_DELETE",
  72: "MESSAGE_DELETE",
  73: "MESSAGE_BULK_DELETE",
  74: "MESSAGE_PIN",
  75: "MESSAGE_UNPIN",
  80: "INTEGRATION_CREATE",
  81: "INTEGRATION_UPDATE",
  82: "INTEGRATION_DELETE",
  83: "STAGE_INSTANCE_CREATE",
  84: "STAGE_INSTANCE_UPDATE",
  85: "STAGE_INSTANCE_DELETE",
  90: "STICKER_CREATE",
  91: "STICKER_UPDATE",
  92: "STICKER_DELETE",
  100: "GUILD_SCHEDULED_EVENT_CREATE",
  101: "GUILD_SCHEDULED_EVENT_UPDATE",
  102: "GUILD_SCHEDULED_EVENT_DELETE",
  110: "THREAD_CREATE",
  111: "THREAD_UPDATE",
  112: "THREAD_DELETE",
  121: "APPLICATION_COMMAND_PERMISSION_UPDATE",
  140: "AUTO_MODERATION_RULE_CREATE",
  141: "AUTO_MODERATION_RULE_UPDATE",
  142: "AUTO_MODERATION_RULE_DELETE",
  143: "AUTO_MODERATION_BLOCK_MESSAGE",
  144: "AUTO_MODERATION_FLAG_TO_CHANNEL",
  145: "AUTO_MODERATION_USER_COMMUNICATION_DISABLED",
  150: "CREATOR_MONETIZATION_REQUEST_CREATED",
  151: "CREATOR_MONETIZATION_TERMS_ACCEPTED",
};

export const RELATIONSHIP_TYPES: Record<number, string> = {
  0: "None",
  1: "Friend",
  2: "Blocked",
  3: "Incoming request",
  4: "Outgoing request",
  5: "Implicit",
};

export const ACTIVITY_DOMAINS = ["Tns", "Reporting", "Modeling"] as const;

export type ActivityDomain = (typeof ACTIVITY_DOMAINS)[number];

export function channelTypeName(type: number): string {
  return CHANNEL_TYPES[type] ?? `Type ${type}`;
}

export function auditLogActionName(actionType: number): string {
  return AUDIT_LOG_ACTIONS[actionType] ?? `ACTION_${actionType}`;
}
