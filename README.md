# discord-viewer

A local, Discord-styled browser for a Discord data package export. Every file in the package is reachable:
messages (DMs, group DMs, server channels), server settings (roles, channels, emoji, webhooks, bans, audit log),
account data (profile, connections, friends, sessions, billing, data exports, guild settings, applications,
notes, activities, ads and quests, support tickets), the raw analytics event stream, and the raw
JSON/CSV/asset files themselves.

## Setup

1. Extract the package into `data/package/` — the top-level `Account/`, `Messages/`, `Servers/`,
   `Activity/` folders should sit directly inside it:

   ```sh
   mkdir -p data && unzip -q ~/path/to/package.zip -d data/package
   ```

   Folder casing does not matter: Discord has shipped both `account/` and `Account/`, and both are read.

2. Install and build the SQLite index:

   ```sh
   bun install
   bun run ingest
   ```

   Expect roughly 90 seconds and ~1.4 GB at `data/index.db` for an 8 GB package — the analytics
   event stream dominates both.

3. Run it:

   ```sh
   bun run dev
   ```

   Open http://localhost:3000.

`data/` is gitignored. Re-run `bun run ingest` after replacing the package.

## What the package does and doesn't contain

Discord only exports messages **you** sent. A DM shows your half of the conversation; the other person
appears through the channel's recipient list, the user directory, and activity events that reference the
channel. Other people's messages, attachments files, and server member lists are not in the export.
Attachments are CDN links that have mostly expired, so they render as unavailable cards.

The export format drifts between versions, and the ingest handles both shapes it has seen:

- Transcripts are `messages.json` (an array of `{ID, Timestamp, Contents, Attachments}`) in current
  packages and `messages.csv` in older ones. `ID` arrives as a bare JSON number that overflows
  `Number.MAX_SAFE_INTEGER`, so it is quoted before parsing to keep every digit.
- `channel.json` writes `type` as an API enum name (`GUILD_TEXT`) rather than a number; the ingest maps
  it back and warns about any name it does not recognise.
- Billing, store, promotion and virtual-currency data moved out of `account/user.json` into
  `account/user_data_exports/`. Both locations are read, so either package version renders.
- `discriminator` is gone and `flags` is now an array of names rather than a bitfield.

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server at http://localhost:3000 |
| `bun run build` / `bun run start` | Production build and server |
| `bun run ingest` | Rebuild `data/index.db` from `data/package/` |
| `bun run smoke` | Exercise every data-layer function against the index |
| `bun run crawl` | Crawl a running server for broken pages |
| `bun run lint` / `bun run tsc --noEmit` | Lint and type check |

## Where things are

| Route | What it shows |
|---|---|
| `/channels/@me` | DM home and every DM / group DM conversation |
| `/channels/<guildId>/<channelId>` | Server channel messages, infinite scroll, `?message=<id>` jumps |
| `/channels/unknown` | Channels whose export has no guild information |
| `/search` | Full-text search over all messages |
| `/servers/<guildId>/...` | Server settings clone: overview, roles, channels, emoji, webhooks, bans, audit log, raw files |
| `/users`, `/users/<id>` | Every user id the package mentions, with what is known about them |
| `/account/...` | User settings clone over `account/user.json` and bot applications |
| `/account/data-exports` | The tabular `account/user_data_exports/` sections, with Discord's own column docs |
| `/account/activities` | Per-activity state from `Activities/` |
| `/account/ads` | Ad-targeting traits and quest history from `Ads/` |
| `/account/support-tickets` | Help Center tickets from `Support_Tickets/` |
| `/activity` | Explorer over the analytics events, filterable and deep-linkable |
| `/stats` | Package-wide dashboard |
| `/api/asset/<path>` | Any raw file from the package |

## Stack

Bun, Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, SQLite with FTS5
(`bun:sqlite` for scripts, better-sqlite3 inside the Next server), csv-parse, and discord-markdown-parser
extended with list rendering and a React AST renderer.
