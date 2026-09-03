# Shared brief for page-building agents

Project: /Users/benz/Documents/discord-viewer — Next.js 16 (App Router, read node_modules/next/dist/docs/ before
writing; conventions differ from older Next), React 19, TypeScript, Tailwind v4, shadcn (base-ui), bun.
Purpose: a local viewer that lets the owner click through and read ABSOLUTELY EVERYTHING in their Discord data
package, styled like the Discord desktop client (dark theme).

Read first: docs/DATA-FORMAT.md, src/lib/data/*.ts (server-only data layer; import functions from
"@/lib/data/<module>", types from "@/lib/data/types"), src/components/** (presentational components; see
src/app/demo/page.tsx for a usage showcase of every component), src/app/globals.css (theme utilities).

## Route ownership (only touch your own paths; other agents work concurrently in the same tree)
- MESSAGES agent: src/app/layout.tsx, src/app/page.tsx, src/app/channels/**, src/app/search/**,
  src/app/api/asset/**, src/components/app/** (data-connected shell pieces), src/lib/resolvers*.ts
- SERVERS agent: src/app/servers/**, src/app/users/**, src/components/servers/**, src/components/users/**
- ACCOUNT agent: src/app/account/**, src/app/stats/**, src/components/account/**, src/components/stats/**
- ACTIVITY agent: src/app/activity/**, src/components/activity/**
Shared presentational components in src/components/{layout,messages,common,ui} are read-only for everyone;
if you need a change there, make a new component in your own folder instead.

## Contracts
- Asset URLs: `/api/asset/<package-relative-path>` serves any file from data/package (e.g.
  `/api/asset/account/avatar.gif`, `/api/asset/servers/<guildId>/icon.jpeg`,
  `/api/asset/servers/<guildId>/emoji/<id>.png`, `/api/asset/servers/<guildId>/webhooks/<hash>.png`).
  The MESSAGES agent implements it via resolvePackageAsset(); everyone else just uses the URL scheme.
- Guild rail (left 72px column) is rendered in the root layout by the MESSAGES agent and links to:
  `/channels/@me` (home/DMs), `/channels/<guildId>` per guild, and footer buttons to `/servers`, `/account`,
  `/activity`, `/stats`, `/search`, `/users`. Every other agent's pages render INSIDE that layout, so
  each page should supply its own middle sidebar + main pane using <AppShell> pieces WITHOUT the rail
  (the MESSAGES agent's layout renders `<GuildRail>` and then `{children}` in a flex row; children fill the rest).
  Concretely: root layout = <div class="flex h-screen"><GuildRail .../>{children}</div>. Your page returns
  the sidebar + main content as flex siblings that fill remaining width/height.
- Route params in Next 16 are Promises: `const { id } = await params`. Search params likewise.
- Long lists must be paginated / cursor based; never render 600k rows.
- Big JSON objects go through <JsonViewer>. Every page that shows a parsed object must also offer a "Raw JSON"
  view so nothing in the package is hidden.

## Rules
- No code comments. Simple, props-driven components; server components by default, client only where needed.
- `bun run tsc --noEmit` and `bun run lint` must pass for your files.
- Verify visually: run your own dev server with `NEXT_DIST_DIR=.next-<name> bun run dev --port <yourPort>` and
  curl / headless-chrome screenshot your routes. Kill it when done.
- Commit with plain `git commit -m` — no Co-Authored-By, no session trailers. `git add` ONLY your own paths
  explicitly (never `git add -A`). Other agents commit concurrently; if a commit fails due to index.lock, retry.
- Do not run `bun run ingest` (data/index.db already exists) and do not touch scripts/ or src/lib/data/.
  If you find a bug in the data layer, note it in your final report instead of fixing it.
