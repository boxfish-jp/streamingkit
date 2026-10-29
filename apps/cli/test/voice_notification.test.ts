import { afterEach, describe, expect, test, vi } from "vitest";
import { VoiceNotifier } from "../src/voice_notification.js";

describe("VoiceNotifier", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("speakはCh4のinstSynthesizeを送信する", () => {
    const emit = vi.fn();
    const notifier = new VoiceNotifier(emit);

    notifier.speak("テスト");

    expect(emit).toHaveBeenCalledWith({
      type: "instSynthesize",
      content: "テスト",
      channel: 4,
    });
  });

  test("読み上げに失敗してもwarnは例外を投げない", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const emit = vi.fn(() => {
      throw new Error("failed");
    });
    const notifier = new VoiceNotifier(emit);

    expect(() => notifier.warn("警告")).not.toThrow();
    expect(error).toHaveBeenCalled();
  });

  test("warnはコンソールと読み上げの両方に出す", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const emit = vi.fn();
    const notifier = new VoiceNotifier(emit);

    notifier.warn("警告");

    expect(warn).toHaveBeenCalledWith("警告");
    expect(emit).toHaveBeenCalledWith({
      type: "instSynthesize",
      content: "警告",
      channel: 4,
    });
  });
});
