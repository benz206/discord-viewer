"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileAudio,
  FileText,
  FileVideo,
  ImageOff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AttachmentInfo = {
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
  width?: number;
  height?: number;
};

export type AttachmentKind = "image" | "video" | "audio" | "file";

export type AttachmentProps = {
  attachment: AttachmentInfo | string;
  className?: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i;
const AUDIO_EXT = /\.(mp3|ogg|oga|wav|flac|m4a|aac)(\?|$)/i;

export function attachmentFilename(url: string) {
  try {
    const path = new URL(url, "https://cdn.discordapp.com").pathname;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() ?? url);
  } catch {
    return url.split("/").pop() ?? url;
  }
}

export function attachmentKind(info: AttachmentInfo): AttachmentKind {
  const type = info.contentType ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  const target = info.filename ?? info.url;
  if (IMAGE_EXT.test(target)) return "image";
  if (VIDEO_EXT.test(target)) return "video";
  if (AUDIO_EXT.test(target)) return "audio";
  return "file";
}

export function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(2) : Math.round(value)} ${units[unit]}`;
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  file: "File",
};

function normalize(attachment: AttachmentInfo | string): AttachmentInfo {
  return typeof attachment === "string" ? { url: attachment } : attachment;
}

function FileCard({
  info,
  kind,
  unavailable,
  children,
}: {
  info: AttachmentInfo;
  kind: AttachmentKind;
  unavailable?: boolean;
  children?: React.ReactNode;
}) {
  const name = info.filename ?? attachmentFilename(info.url);
  const size = formatBytes(info.size);
  const Icon =
    kind === "image"
      ? ImageOff
      : kind === "video"
        ? FileVideo
        : kind === "audio"
          ? FileAudio
          : FileText;

  return (
    <div className="max-w-md rounded-lg border border-divider bg-surface-2 p-3">
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "size-8 shrink-0",
            unavailable ? "text-danger" : "text-link",
          )}
        />
        <div className="min-w-0 flex-1">
          <a
            href={info.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block truncate text-sm font-medium text-link hover:underline"
          >
            {name}
          </a>
          <div className="text-xs text-channel">
            {unavailable ? "Attachment unavailable" : null}
            {unavailable && size ? " · " : null}
            {size}
            {!unavailable && !size ? info.contentType ?? KIND_LABEL[kind] : null}
          </div>
        </div>
        <a
          href={info.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Open original"
          className="shrink-0 rounded p-1 text-interactive hover:bg-hover hover:text-interactive-hover"
        >
          {unavailable ? (
            <ExternalLink className="size-5" />
          ) : (
            <Download className="size-5" />
          )}
        </a>
      </div>
      {children}
    </div>
  );
}

function ImageAttachment({ info }: { info: AttachmentInfo }) {
  const [failed, setFailed] = useState(false);
  const name = info.filename ?? attachmentFilename(info.url);

  if (failed) {
    return <FileCard info={info} kind="image" unavailable />;
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Open ${name}`}
            className="block max-w-full cursor-zoom-in overflow-hidden rounded-lg outline-none"
          />
        }
      >
        <img
          src={info.url}
          alt={name}
          width={info.width}
          height={info.height}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="max-h-[350px] max-w-full rounded-lg object-contain"
        />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(90vw,1200px)] bg-transparent p-0 ring-0 sm:max-w-[min(90vw,1200px)]"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <img
          src={info.url}
          alt={name}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        <a
          href={info.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-link hover:underline"
        >
          Open original
        </a>
      </DialogContent>
    </Dialog>
  );
}

function VideoAttachment({ info }: { info: AttachmentInfo }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FileCard info={info} kind="video" unavailable />;
  }

  return (
    <video
      controls
      preload="metadata"
      src={info.url}
      onError={() => setFailed(true)}
      className="max-h-[350px] max-w-md rounded-lg bg-black"
    />
  );
}

function AudioAttachment({ info }: { info: AttachmentInfo }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FileCard info={info} kind="audio" unavailable />;
  }

  return (
    <FileCard info={info} kind="audio">
      <audio
        controls
        preload="metadata"
        src={info.url}
        onError={() => setFailed(true)}
        className="mt-2 w-full"
      />
    </FileCard>
  );
}

export function Attachment({ attachment, className }: AttachmentProps) {
  const info = normalize(attachment);
  const kind = attachmentKind(info);

  return (
    <div className={cn("max-w-full", className)}>
      {kind === "image" ? <ImageAttachment info={info} /> : null}
      {kind === "video" ? <VideoAttachment info={info} /> : null}
      {kind === "audio" ? <AudioAttachment info={info} /> : null}
      {kind === "file" ? <FileCard info={info} kind="file" /> : null}
    </div>
  );
}
