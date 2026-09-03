import { SimpleMarkdown, rules, rulesExtended } from "discord-markdown-parser";
import type {
  Capture,
  Parser,
  ParserRule,
  State,
} from "discord-markdown-parser/dist/simple-markdown";

export type MarkdownNode = {
  type: string;
  content?: MarkdownNode[] | string;
  [key: string]: unknown;
};

export type ListItemNode = {
  content: MarkdownNode[];
  children: MarkdownNode[];
};

const LIST_BLOCK_REGEX =
  /^( *)(?:[*+-]|\d+\.) +[^\n]*(?:\n *(?:[*+-]|\d+\.) +[^\n]*)*\n?/;
const LIST_ITEM_REGEX = /^( *)(?:([*+-])|(\d+)\.) +(.*)$/;

type RawItem = {
  indent: number;
  ordered: boolean;
  start: number;
  text: string;
};

function buildList(
  raw: RawItem[],
  from: number,
  nestedParse: Parser,
  state: State,
): { node: MarkdownNode; next: number } {
  const indent = raw[from].indent;
  const ordered = raw[from].ordered;
  const items: ListItemNode[] = [];
  let index = from;

  while (index < raw.length && raw[index].indent >= indent) {
    if (raw[index].indent > indent) {
      const sub = buildList(raw, index, nestedParse, state);
      const last = items[items.length - 1];
      if (last) last.children.push(sub.node);
      index = sub.next;
      continue;
    }
    if (raw[index].ordered !== ordered) break;
    items.push({
      content: nestedParse(raw[index].text, state) as MarkdownNode[],
      children: [],
    });
    index += 1;
  }

  return {
    node: { type: "list", ordered, start: raw[from].start, items },
    next: index,
  };
}

const list: ParserRule = {
  order: SimpleMarkdown.defaultRules.heading.order - 0.25,
  match(source: string, state: State) {
    const previous = state.prevCapture as Capture | null | undefined;
    if (previous && previous.slice(-1)[0] !== "\n") return null;
    return LIST_BLOCK_REGEX.exec(source);
  },
  parse(capture: Capture, nestedParse: Parser, state: State) {
    const raw: RawItem[] = capture[0]
      .replace(/\n$/, "")
      .split("\n")
      .map((line) => {
        const item = LIST_ITEM_REGEX.exec(line);
        return {
          indent: item?.[1].length ?? 0,
          ordered: item?.[2] === undefined,
          start: item?.[3] ? Number.parseInt(item[3], 10) : 1,
          text: item?.[4] ?? line,
        };
      });
    return buildList(raw, 0, nestedParse, state).node;
  },
};

const parseNormal = SimpleMarkdown.parserFor({ ...rules, list });
const parseExtended = SimpleMarkdown.parserFor({ ...rulesExtended, list });

export function parseDiscordMarkdown(
  input: string,
  extended = true,
): MarkdownNode[] {
  const parser = extended ? parseExtended : parseNormal;
  return parser(input, { inline: true }) as MarkdownNode[];
}

export function isEmojiOnly(nodes: MarkdownNode[]) {
  let emojiCount = 0;
  for (const node of nodes) {
    if (node.type === "emoji" || node.type === "twemoji") {
      emojiCount += 1;
      continue;
    }
    if (node.type === "text" && typeof node.content === "string") {
      if (node.content.trim() === "") continue;
      return 0;
    }
    if (node.type === "br" || node.type === "newline") continue;
    return 0;
  }
  return emojiCount > 0 && emojiCount <= 27 ? emojiCount : 0;
}

const TIMESTAMP_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { hour: "numeric", minute: "2-digit" },
  T: { hour: "numeric", minute: "2-digit", second: "2-digit" },
  d: { day: "2-digit", month: "2-digit", year: "numeric" },
  D: { day: "numeric", month: "long", year: "numeric" },
  f: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  F: {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

export function formatRelative(date: Date, now = Date.now()) {
  const deltaSeconds = (date.getTime() - now) / 1000;
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(deltaSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return formatter.format(0, "second");
}

export function formatDiscordTimestamp(seconds: number, format = "f") {
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return `<t:${seconds}>`;
  if (format === "R") return formatRelative(date);
  const options = TIMESTAMP_OPTIONS[format] ?? TIMESTAMP_OPTIONS.f;
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function emojiUrl(id: string, animated?: boolean, size = 48) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?size=${size}`;
}

export function toDate(value: string | number | Date) {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const parsed = new Date(value.includes(" ") ? value.replace(" ", "T") : value);
  return parsed;
}

export function formatMessageTime(value: string | number | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatClockTime(value: string | number | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatFullTime(value: string | number | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatDateDivider(value: string | number | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function dayKey(value: string | number | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
