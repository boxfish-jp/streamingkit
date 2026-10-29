import type { MediaInfoMessage } from "kit_models";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AnimePlaybackMute } from "../src/anime_playback_mute.js";

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

describe("AnimePlaybackMute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("アニメのPlayingメッセージでミュートする", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("anime"));

    expect(setDesktopMuted).toHaveBeenCalledWith(true);
    await watcher.dispose();
  });

  test("最後のPlayingメッセージから10秒経過するとミュートを解除する", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(9_999);

    expect(setDesktopMuted).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(setDesktopMuted).toHaveBeenLastCalledWith(false);
  });

  test("Playingメッセージが続く間はタイマーがリセットされる", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(5_000);
    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(9_999);

    expect(setDesktopMuted).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(setDesktopMuted).toHaveBeenLastCalledWith(false);
  });

  test("音楽のmediaInfoではミュートしない", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("music"));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(setDesktopMuted).not.toHaveBeenCalled();
  });

  test("解除後に再度Playingメッセージが来たらミュートする", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await vi.advanceTimersByTimeAsync(10_000);
    watcher.handleMessage(mediaInfo("anime"));

    expect(setDesktopMuted).toHaveBeenCalledTimes(3);
    expect(setDesktopMuted).toHaveBeenLastCalledWith(true);
  });

  test("disposeでタイマーを破棄し、ミュート中なら解除する", async () => {
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {});
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    watcher.handleMessage(mediaInfo("anime"));
    await watcher.dispose();

    expect(setDesktopMuted).toHaveBeenLastCalledWith(false);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(setDesktopMuted).toHaveBeenCalledTimes(2);
  });

  test("setDesktopMutedが失敗してもhandleMessageは例外を投げない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const setDesktopMuted = vi.fn(async (_muted: boolean) => {
      throw new Error("failed");
    });
    const watcher = new AnimePlaybackMute({ setDesktopMuted });

    expect(() => watcher.handleMessage(mediaInfo("anime"))).not.toThrow();

    await vi.advanceTimersByTimeAsync(10_000);

    expect(error).toHaveBeenCalled();
  });
});
