import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WatchMicSignal } from "../src/watch_mic_signal.js";

const createWatcher = (options: { checkDelayMs?: number } = {}) => {
  const onWarning = vi.fn();
  const watcher = new WatchMicSignal({ onWarning, ...options });
  return { watcher, onWarning };
};

describe("WatchMicSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("配信開始から2分間マイクレベルが0なら警告する", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).toHaveBeenCalledTimes(1);

    watcher.dispose();
  });

  test("2分以内にマイクレベルが入れば警告しない", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    watcher.handleMicPeak(0.1);
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).not.toHaveBeenCalled();

    watcher.dispose();
  });

  test("配信が止まるとマイクのタイマーを破棄する", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    watcher.handleStreaming(false);
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).not.toHaveBeenCalled();

    watcher.dispose();
  });

  test("配信開始が重複しても警告は1回だけ", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    watcher.handleStreaming(true);
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).toHaveBeenCalledTimes(1);

    watcher.dispose();
  });

  test("配信を再開すると再度警告する", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(onWarning).toHaveBeenCalledTimes(1);

    watcher.handleStreaming(false);
    watcher.handleStreaming(true);
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).toHaveBeenCalledTimes(2);

    watcher.dispose();
  });

  test("dispose後は警告しない", async () => {
    const { watcher, onWarning } = createWatcher();

    watcher.handleStreaming(true);
    watcher.dispose();
    await vi.advanceTimersByTimeAsync(120_000);

    expect(onWarning).not.toHaveBeenCalled();
  });
});
