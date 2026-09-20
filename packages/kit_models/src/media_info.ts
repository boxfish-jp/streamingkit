export type MediaKind = "anime" | "music";

export interface MediaInfoMessage {
  type: "mediaInfo";
  kind: MediaKind;
  title: string;
  episode: string;
  progress: number;
  duration: number;
  artist: string;
  album: string;
  artworkUrl: string;
  uri: string;
  playbackStatus: "Playing" | "Paused" | "Stopped";
}
