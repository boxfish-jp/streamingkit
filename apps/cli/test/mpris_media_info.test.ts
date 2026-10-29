import { Variant } from "dbus-next";
import type { MediaInfoMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import {
  buildMusicMediaInfo,
  toMprisProperties,
} from "../src/mpris_media_info.js";

const metadata = {
  "mpris:trackid": new Variant("o", "/com/spotify/track/abc123"),
  "mpris:length": new Variant("t", 220_720_000n),
  "mpris:artUrl": new Variant("s", "https://i.scdn.co/image/cover"),
  "xesam:album": new Variant("s", "以心☆電信"),
  "xesam:artist": new Variant("as", ["みらくらぱーく!"]),
  "xesam:title": new Variant("s", "スノウ・グライダー"),
  "xesam:url": new Variant("s", "https://open.spotify.com/track/abc123"),
};

describe("toMprisProperties", () => {
  test("Variantに包まれたプロパティを辞書に変換できる", () => {
    const result = toMprisProperties(
      new Variant("a{sv}", { "xesam:title": new Variant("s", "タイトル") }),
    );

    expect(result["xesam:title"]).toBeInstanceOf(Variant);
  });

  test("辞書でない値は空の辞書になる", () => {
    expect(toMprisProperties(null)).toEqual({});
    expect(toMprisProperties("invalid")).toEqual({});
  });
});

describe("buildMusicMediaInfo", () => {
  test("MPRIS Metadata辞書からmusic用のMediaInfoMessageを構築できる", () => {
    const result = buildMusicMediaInfo(metadata, "Playing", 101_250_000n);
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
    const result = buildMusicMediaInfo(multiArtist, "Playing", 0);
    expect(result.artist).toBe("Artist A, Artist B");
  });

  test("xesam:urlがない場合はmpris:trackidをuriにフォールバックする", () => {
    const { "xesam:url": _url, ...withoutUrl } = metadata;
    const result = buildMusicMediaInfo(withoutUrl, "Playing", 0);
    expect(result.uri).toBe("/com/spotify/track/abc123");
  });

  test("空のMetadata(再生トラックなし)は空フィールドになる", () => {
    const result = buildMusicMediaInfo({}, "Stopped", 0);
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
    expect(buildMusicMediaInfo(metadata, "", 0).playbackStatus).toBe("Stopped");
    expect(buildMusicMediaInfo(metadata, "Hoge", 0).playbackStatus).toBe(
      "Stopped",
    );
  });

  test("positionUsとlengthUsは秒に切り捨てて変換する", () => {
    const result = buildMusicMediaInfo(metadata, "Playing", 1_999_999);
    expect(result.progress).toBe(1);
    expect(result.duration).toBe(220);
  });
});
