import { Variant } from "dbus-next";
import type { MediaInfoMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import { buildMediaInfo } from "../src/watch_spotify.js";

const metadata = {
  "mpris:trackid": new Variant("o", "/com/spotify/track/abc123"),
  "mpris:length": new Variant("t", 220_720_000n),
  "mpris:artUrl": new Variant("s", "https://i.scdn.co/image/cover"),
  "xesam:album": new Variant("s", "以心☆電信"),
  "xesam:artist": new Variant("as", ["みらくらぱーく!"]),
  "xesam:title": new Variant("s", "スノウ・グライダー"),
  "xesam:url": new Variant("s", "https://open.spotify.com/track/abc123"),
};

describe("buildMediaInfo", () => {
  test("MPRIS Metadata辞書からmusic用のMediaInfoMessageを構築できる", () => {
    const result = buildMediaInfo(metadata, "Playing", 101_250_000n);
    expect(result).toEqual<MediaInfoMessage>({
      type: "mediaInfo",
      kind: "music",
      title: "スノウ・グライダー",
      episode: "",
      progress: 101,
      duration: 220,
      artist: "みらくらぱーく!",
      album: "以心☆電信",
      artworkUrl: "https://i.scdn.co/image/cover",
      uri: "https://open.spotify.com/track/abc123",
      playbackStatus: "Playing",
    });
  });

  test("複数アーティストは', 'で連結する", () => {
    const multiArtist = {
      ...metadata,
      "xesam:artist": new Variant("as", ["Artist A", "Artist B"]),
    };
    const result = buildMediaInfo(multiArtist, "Playing", 0);
    expect(result.artist).toBe("Artist A, Artist B");
  });

  test("xesam:urlがない場合はmpris:trackidをuriにフォールバックする", () => {
    const { "xesam:url": _url, ...withoutUrl } = metadata;
    const result = buildMediaInfo(withoutUrl, "Playing", 0);
    expect(result.uri).toBe("/com/spotify/track/abc123");
  });

  test("空のMetadata(再生トラックなし)は空フィールドになる", () => {
    const result = buildMediaInfo({}, "Stopped", 0);
    expect(result).toMatchObject<Partial<MediaInfoMessage>>({
      title: "",
      artist: "",
      album: "",
      artworkUrl: "",
      uri: "",
      progress: 0,
      duration: 0,
      playbackStatus: "Stopped",
    });
  });

  test("PlaybackStatusがPlaying/Paused以外の値はStoppedになる", () => {
    expect(buildMediaInfo(metadata, "", 0).playbackStatus).toBe("Stopped");
    expect(buildMediaInfo(metadata, "Hoge", 0).playbackStatus).toBe("Stopped");
  });

  test("positionUsとlengthUsは秒に切り捨てて変換する", () => {
    const result = buildMediaInfo(metadata, "Playing", 1_999_999);
    expect(result.progress).toBe(1);
    expect(result.duration).toBe(220);
  });
});
