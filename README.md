# discord-viewer

A local, Discord-styled browser for a Discord data package export. Every file in the package is reachable:
messages (DMs, group DMs, server channels), server settings (roles, channels, emoji, webhooks, bans, audit log),
account data (profile, connections, friends, sessions, billing, guild settings, applications, notes), the raw
analytics event stream, and the raw JSON/CSV/asset files themselves.

## Setup

1. Extract the package so `data/package/` contains `account/`, `messages/`, `servers/`, `activity/`, `README.txt`:

   ```sh
   mkdir -p data && unzip -q ~/path/to/package.zip -d data/package
   ```

2. Install and build the SQLite index (about 20 seconds, ~700 MB at `data/index.db`):

   ```sh
   pnpm install
   pnpm ingest
   ```

3. Run it:

   ```sh
   pnpm dev
   ```

   Open http://localhost:3000.

`data/` is gitignored. Re-run `pnpm ingest` after replacing the package.

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
| `/activity` | Explorer over the 1.7M analytics events, filterable and deep-linkable |
| `/stats` | Package-wide dashboard |
| `/api/asset/<path>` | Any raw file from the package |

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, better-sqlite3 with FTS5,
csv-parse, discord-markdown-parser (extended with list rendering and a React AST renderer).
