import type { InstSyntesizeMessage } from "kit_models";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TimeSignal } from "../src/time_signal.js";

function setJstTime(hour: number, minute: number): void {
  const utcTimestamp = Date.UTC(2026, 0, 1, hour - 9, minute, 0, 0);
  vi.setSystemTime(new Date(utcTimestamp));
}

describe("TimeSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("配信中でなければ何もしない", () => {
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => false, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();

    expect(onMessage).not.toHaveBeenCalled();
  });

  test("正時に時報を発行する", () => {
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => true, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({
      type: "instSynthesize",
      content: "15時になりました",
      channel: 4,
    } satisfies InstSyntesizeMessage);
  });

  test("30分に時報を発行する", () => {
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => true, onMessage);

    setJstTime(15, 30);
    (ts as any)._check();

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({
      type: "instSynthesize",
      content: "15時30分です",
      channel: 4,
    } satisfies InstSyntesizeMessage);
  });

  test("同じ時刻の時報が重複しない", () => {
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => true, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();
    (ts as any)._check();

    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  test("時報対象外の分で_lastSignalKeyをリセットする", () => {
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => true, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();
    expect((ts as any)._lastSignalKey).toBe("15:00");

    setJstTime(15, 1);
    (ts as any)._check();
    expect((ts as any)._lastSignalKey).toBeNull();
  });

  test("配信停止中は_lastSignalKeyをリセットしない", () => {
    let isStreaming = true;
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => isStreaming, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();
    expect((ts as any)._lastSignalKey).toBe("15:00");

    isStreaming = false;
    setJstTime(15, 1);
    (ts as any)._check();
    expect((ts as any)._lastSignalKey).toBe("15:00");
  });

  test("配信停止→再開で次の時報が流れる", () => {
    let isStreaming = true;
    const onMessage = vi.fn();
    const ts = new TimeSignal(() => isStreaming, onMessage);

    setJstTime(15, 0);
    (ts as any)._check();
    expect(onMessage).toHaveBeenCalledWith({
      type: "instSynthesize",
      content: "15時になりました",
      channel: 4,
    } satisfies InstSyntesizeMessage);

    isStreaming = false;
    setJstTime(15, 1);
    (ts as any)._check();

    isStreaming = true;
    setJstTime(15, 30);
    (ts as any)._check();

    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenLastCalledWith({
      type: "instSynthesize",
      content: "15時30分です",
      channel: 4,
    } satisfies InstSyntesizeMessage);
  });
});
