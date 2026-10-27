import type { MediaInfoMessage } from "kit_models";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WatchAnimeAudio } from "../src/watch_anime_audio.js";

const mediaInfo = (
  kind: MediaInfoMessage["kind"],
  playbackStatus: MediaInfoMessage["playbackStatus"] = "Playing",
): MediaInfoMessage => ({
  type: "mediaInfo",
  kind,
  title: "テストアニメ",
  episode: "1話",
  progress: 10,
  duration: 100,
  artist: "",
  album: "",
  artworkUrl: "",
  uri: "",
  playbackStatus,
});

describe("WatchAnimeAudio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("アニメのPlayingメッセージでミュートする", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("anime"));

    expect(setMuted).toHaveBeenCalledWith(true);
    await watcher.dispose();
  });

  test("最後のPlayingメッセージから10秒経過するとミュートを解除する", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(9_999);

    expect(setMuted).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(setMuted).toHaveBeenLastCalledWith(false);
  });

  test("Playingメッセージが続く間はタイマーがリセットされる", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(5_000);
    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(9_999);

    expect(setMuted).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(setMuted).toHaveBeenLastCalledWith(false);
  });

  test("音楽のmediaInfoではミュートしない", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("music"));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(setMuted).not.toHaveBeenCalled();
  });

  test("解除後に再度Playingメッセージが来たらミュートする", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(10_000);
    watcher.handleMessage(mediaInfo("anime"));

    expect(setMuted).toHaveBeenCalledTimes(3);
    expect(setMuted).toHaveBeenLastCalledWith(true);
  });

  test("disposeでタイマーを破棄し、ミュート中なら解除する", async () => {
    const setMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new WatchAnimeAudio({ setMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await watcher.dispose();

    expect(setMuted).toHaveBeenLastCalledWith(false);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(setMuted).toHaveBeenCalledTimes(2);
  });

  test("setMutedが失敗してもhandleMessageは例外を投げない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const setMuted = vi.fn(async (_muted: boolean) => {
      throw new Error("failed");
    });
    const watcher = new WatchAnimeAudio({ setMuted });

    expect(() => watcher.handleMessage(mediaInfo("anime"))).not.toThrow();

    await vi.advanceTimersByTimeAsync(10_000);

    expect(error).toHaveBeenCalled();
  });
});
