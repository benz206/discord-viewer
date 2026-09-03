# Discord data package layout (extracted at `data/package/`, gitignored)

Total ~2.9 GB, 22k files. Export date 2022-10-06. Owner user id: 360061101477724170.

## account/
- `user.json` — object with keys: id, username, discriminator (int), email, verified, avatar_hash,
  has_mobile, needs_email_verification, premium_until, flags, phone, temp_banned_until, ip,
  settings{}, connections[], external_friends_lists[], friend_suggestions[], user_sessions[] (7),
  relationships[] (35, each has user {id, username, discriminator, avatar}, type), payments[] (3),
  payment_sources[] (1), guild_settings[] (272), library_applications[], entitlements[] (7),
  user_activity_application_statistics[] (13), notes{} (32, keyed by user id), user_profile_metadata{}.
- `avatar.gif`
- `applications/<appId>/application.json` (+ `icon.png`, `bot-avatar.png`) — 5 bot applications.

## messages/
- `index.json` — `{ "<channelId>": "Direct Message with name#1234" | "<channel-name>" | null }` (7289 entries)
- `c<channelId>/channel.json` — either
  - DM: `{"id","type":1,"recipients":["userId","userId"]}`
  - Guild channel: `{"id","type":0,"name","guild":{"id","name"}}` (type may be other ints: 0 text, 2 voice, 5 news, 10-12 threads, 3 group DM etc.)
- `c<channelId>/messages.csv` — header `ID,Timestamp,Contents,Attachments`. Contents may span lines (quoted).
  Timestamp like `2022-08-02 00:59:59.753000+00:00`. Attachments = space-separated URLs. ~675k rows total.
  Largest single file ~10 MB. ALL messages in this export are authored by the package owner.

## servers/
- `index.json` — `{ "<guildId>": "Guild Name" }` (~30 guilds)
- `<guildId>/guild.json` — full guild object incl. `roles: { id: {id,name,permissions,position,color,hoist,...} }`,
  owner_id, icon_hash, features, verification_level, etc. Small guilds only have `{id,name}`-ish subset.
- `<guildId>/channels.json` — array of channel objects (type 4 = category, parent_id, permission_overwrites, topic, nsfw, bitrate...)
- `<guildId>/audit-log.json` — array of `{id,user_id,action_type,changes:[{key,new_value,old_value}], target_id?, options?}`
- `<guildId>/bans.json` — `[{user_id, reason}]`
- `<guildId>/emoji.json` — `[{name,id,animated,roles,user_id,...}]`, images in `emoji/<id>.png|gif`
- `<guildId>/webhooks.json` — `[{type,id,name,avatar,channel_id,guild_id,application_id}]`, avatars in `webhooks/<hash>.png`
- `<guildId>/icon.jpeg` (optional)
Not every guild has every file. Only 4 guilds have channels.json (ones the user administered).

## activity/
Newline-delimited JSON (one event object per line). Very large; MUST be indexed, never loaded whole.
- `activity/tns/events-2022-00000-of-00001.json` — 273 MB, 149,836 lines (reactions, messages sent, etc.)
- `activity/reporting/events-2022-00000-of-00001.json` — 2.43 GB, 1,433,964 lines (app_opened, client events)
- `activity/modeling/events-2022-00000-of-00001.json` — 281 MB, 154,155 lines (voice, etc.)
Every event has `event_type`, `event_id`, `domain`, `user_id`, `day`, plus varying fields
(ip, city, os, browser, guild_id, channel_id, message_id, emoji_name, `timestamp` as a JSON-string-in-string
like `"\"2020-03-26T05:07:54.364Z\""`, `_hour_utc`, `_day_utc`, etc.). Field set differs per event_type.

## programs/ — empty. `README.txt` — welcome text.
