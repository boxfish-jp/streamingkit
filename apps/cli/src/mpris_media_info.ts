import { Variant } from "dbus-next";
import type { MediaInfoMessage } from "kit_models";

const MICROS_PER_SECOND = 1_000_000;

export interface MprisProperties {
  [property: string]: unknown;
}

const unwrap = (value: unknown): unknown => {
  if (value instanceof Variant) return value.value;
  if (
    value !== null &&
    typeof value === "object" &&
    "signature" in value &&
    "value" in value
  )
    return (value as { value: unknown }).value;
  return value;
};

export const toStringOrEmpty = (value: unknown): string => {
  const unwrapped = unwrap(value);
  return typeof unwrapped === "string" ? unwrapped : "";
};

export const toNumberOrZero = (value: unknown): number => {
  const unwrapped = unwrap(value);
  return typeof unwrapped === "bigint" || typeof unwrapped === "number"
    ? Number(unwrapped)
    : 0;
};

const toStringArray = (value: unknown): string[] => {
  const unwrapped = unwrap(value);
  return Array.isArray(unwrapped) ? unwrapped.map(String) : [];
};

const toPlaybackStatus = (
  status: string,
): MediaInfoMessage["playbackStatus"] => {
  if (status === "Playing" || status === "Paused") return status;
  return "Stopped";
};

export const toMprisProperties = (value: unknown): MprisProperties => {
  const unwrapped = unwrap(value);
  return unwrapped !== null &&
    typeof unwrapped === "object" &&
    !Array.isArray(unwrapped)
    ? (unwrapped as MprisProperties)
    : {};
};

export const buildMusicMediaInfo = (
  metadata: MprisProperties,
  playbackStatus: string,
  positionUs: number | bigint,
): MediaInfoMessage => ({
  type: "mediaInfo",
  kind: "music",
  title: toStringOrEmpty(metadata["xesam:title"]),
  episode: "",
  progress: Math.floor(Number(positionUs) / MICROS_PER_SECOND),
  duration: Math.floor(
    toNumberOrZero(metadata["mpris:length"]) / MICROS_PER_SECOND,
  ),
  artist: toStringArray(metadata["xesam:artist"]).join(", "),
  album: toStringOrEmpty(metadata["xesam:album"]),
  artworkUrl: toStringOrEmpty(metadata["mpris:artUrl"]),
  uri:
    toStringOrEmpty(metadata["xesam:url"]) ||
    toStringOrEmpty(metadata["mpris:trackid"]),
  playbackStatus: toPlaybackStatus(playbackStatus),
});
