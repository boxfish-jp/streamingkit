import type { StreamInfoMessage } from "kit_models";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WatchStreamStart } from "../src/watch_stream_start.js";

const streamingInfo = (
  site: StreamInfoMessage["site"],
  isStreaming: boolean,
): StreamInfoMessage => ({
  type: "streaming_info",
  site,
  isStreaming,
  wasStreaming: !isStreaming,
});

const createWatcher = (options: { graceMs?: number } = {}) => {
  const onWarning = vi.fn();
  const watcher = new WatchStreamStart({ onWarning, ...options });
  return { watcher, onWarning };
};

describe("WatchStreamStart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("サイトの配信開始から15秒経っても配信が始まらなければ警告する", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    await vi.advanceTimersByTimeAsync(14_999);

    expect(onWarning).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(onWarning).toHaveBeenCalled();

    watcher.dispose();
  });

  test("猶予内に配信が始まれば警告を通知しない", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    await vi.advanceTimersByTimeAsync(10_000);
    watcher.handleStreaming(true);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(onWarning).not.toHaveBeenCalled();

    watcher.dispose();
  });

  test("サイトの配信が止まれば警告を通知しない", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    await vi.advanceTimersByTimeAsync(10_000);
    watcher.handleStreamingInfo(streamingInfo("niconico", false));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(onWarning).not.toHaveBeenCalled();

    watcher.dispose();
  });

  test("警告は同じ配信で1回だけ通知する", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    watcher.handleStreamingInfo(streamingInfo("youtube", true));
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onWarning).toHaveBeenCalledTimes(1);

    watcher.dispose();
  });

  test("片方のサイトが止まっても他方が続いていれば警告する", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    watcher.handleStreamingInfo(streamingInfo("youtube", true));
    watcher.handleStreamingInfo(streamingInfo("niconico", false));
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onWarning).toHaveBeenCalled();

    watcher.dispose();
  });

  test("配信開始がサイト検知より先でも警告を通知しない", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreaming(true);
    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onWarning).not.toHaveBeenCalled();

    watcher.dispose();
  });

  test("dispose後は警告を通知しない", async () => {
    const { watcher, onWarning } = createWatcher({ graceMs: 15_000 });

    watcher.handleStreamingInfo(streamingInfo("niconico", true));
    watcher.dispose();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onWarning).not.toHaveBeenCalled();
  });
});
