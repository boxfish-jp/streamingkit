import type { OBSWebSocket } from "obs-websocket-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ObsAudioClient } from "../src/obs_audio_client.js";

type Listener = (...args: unknown[]) => void;

class FakeObs {
  private _listeners = new Map<string, Set<Listener>>();
  public call = vi.fn(async (requestType: string, _data?: unknown) => {
    if (requestType === "GetSpecialInputs") {
      return { desktop1: "デスクトップ音声", desktop2: "" };
    }
    return {};
  });
  public connect = vi.fn(async () => ({}));
  public disconnect = vi.fn(async () => {});

  on(event: string, listener: Listener) {
    const listeners = this._listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this._listeners.set(event, listeners);
  }

  off(event: string, listener: Listener) {
    this._listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]) {
    this._listeners.get(event)?.forEach((listener) => {
      listener(...args);
    });
  }
}

const flushPromises = async () => {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
};

const createClient = (
  fake: FakeObs,
  inputName?: string,
  onMuteApplied?: (muted: boolean) => void,
) =>
  new ObsAudioClient(
    { url: "ws://127.0.0.1:4455", inputName, onMuteApplied },
    fake as unknown as OBSWebSocket,
  );

describe("ObsAudioClient", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("Identified後にGetSpecialInputsでデスクトップ音声を解決してミュートする", async () => {
    const fake = new FakeObs();
    const client = createClient(fake);

    await client.start();
    await client.setMuted(true);
    fake.emit("Identified");
    await flushPromises();

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs");
    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });

    await client.dispose();
  });

  test("入力名を指定した場合はGetSpecialInputsを呼ばない", async () => {
    const fake = new FakeObs();
    const client = createClient(fake, "カスタム音声");

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    expect(fake.call).not.toHaveBeenCalledWith("GetSpecialInputs");
    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "カスタム音声",
      inputMuted: true,
    });

    await client.dispose();
  });

  test("接続前にsetMutedしてもIdentified後に適用する", async () => {
    const fake = new FakeObs();
    const client = createClient(fake);

    await client.setMuted(true);
    expect(fake.call).not.toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });

    await client.start();
    fake.emit("Identified");
    await flushPromises();

    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });

    await client.dispose();
  });

  test("ミュートとミュート解除の適用後にonMuteAppliedを呼ぶ", async () => {
    const fake = new FakeObs();
    const onMuteApplied = vi.fn();
    const client = createClient(fake, undefined, onMuteApplied);

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    expect(onMuteApplied).toHaveBeenLastCalledWith(true);

    await client.setMuted(false);

    expect(onMuteApplied).toHaveBeenLastCalledWith(false);
    expect(onMuteApplied).toHaveBeenCalledTimes(2);

    await client.dispose();
  });

  test("再接続で同じ状態を再適用してもonMuteAppliedを重複して呼ばない", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    const onMuteApplied = vi.fn();
    const client = createClient(fake, undefined, onMuteApplied);

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    fake.emit("ConnectionClosed", new Error("closed"));
    await vi.advanceTimersByTimeAsync(1_000);
    fake.emit("Identified");
    await flushPromises();

    expect(fake.call).toHaveBeenLastCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
    expect(onMuteApplied).toHaveBeenCalledTimes(1);

    await client.dispose();
  });

  test("ミュート設定に失敗した場合はonMuteAppliedを呼ばない", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.call.mockImplementation(async (requestType: string) => {
      if (requestType === "GetSpecialInputs") {
        return { desktop1: "デスクトップ音声", desktop2: "" };
      }
      throw new Error("failed");
    });
    const onMuteApplied = vi.fn();
    const client = createClient(fake, undefined, onMuteApplied);

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    expect(onMuteApplied).not.toHaveBeenCalled();

    await client.dispose();
  });

  test("desktop1が空の場合はdesktop2を使う", async () => {
    const fake = new FakeObs();
    fake.call.mockImplementationOnce(async () => ({
      desktop1: "",
      desktop2: "デスクトップ音声 2",
    }));
    const client = createClient(fake);

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声 2",
      inputMuted: true,
    });

    await client.dispose();
  });

  test("切断後に再接続して希望状態を再適用する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    const client = createClient(fake);

    await client.start();
    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    fake.emit("ConnectionClosed", new Error("closed"));
    await vi.advanceTimersByTimeAsync(1_000);
    fake.emit("Identified");
    await flushPromises();

    expect(fake.connect).toHaveBeenCalledTimes(2);
    expect(fake.call).toHaveBeenLastCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });

    await client.dispose();
  });

  test("接続失敗時は1秒後に再接続する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.connect.mockRejectedValueOnce(new Error("refused"));
    const client = createClient(fake);

    await client.start();
    expect(fake.connect).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(fake.connect).toHaveBeenCalledTimes(2);
    await client.dispose();
  });

  test("disposeで再接続タイマーを止める", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.connect.mockRejectedValue(new Error("refused"));
    const client = createClient(fake);

    await client.start();
    await client.dispose();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(fake.connect).toHaveBeenCalledTimes(1);
  });
});
