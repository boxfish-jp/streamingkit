import { EventSubscription } from "obs-websocket-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createObsConnection, FakeObs, flushPromises } from "./fake_obs.js";

describe("ObsConnection", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("Identifiedで接続を通知しInputVolumeMetersを購読する", async () => {
    const fake = new FakeObs();
    const onConnected = vi.fn();
    const connection = createObsConnection(fake, { onConnected });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();

    expect(fake.connect).toHaveBeenCalledWith(
      "ws://127.0.0.1:4455",
      undefined,
      {
        eventSubscriptions:
          EventSubscription.Outputs | EventSubscription.InputVolumeMeters,
      },
    );
    expect(onConnected).toHaveBeenLastCalledWith(true);

    await connection.dispose();
  });

  test("onConnectionChangedで接続状態を通知する", async () => {
    const fake = new FakeObs();
    const connection = createObsConnection(fake);
    const listener = vi.fn();
    const unsubscribe = connection.onConnectionChanged(listener);

    await connection.start();
    fake.emit("Identified");
    await flushPromises();

    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
    await connection.dispose();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("connectの解決がIdentifiedより遅れても切断を通知する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    let resolveConnect = () => {};
    fake.connect.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveConnect = () => resolve();
        }),
    );
    const onConnected = vi.fn();
    const connection = createObsConnection(fake, { onConnected });

    const started = connection.start();
    fake.emit("Identified");
    await flushPromises();
    expect(onConnected).toHaveBeenLastCalledWith(true);

    resolveConnect();
    await started;
    fake.emit("ConnectionClosed", new Error("closed"));

    expect(onConnected).toHaveBeenLastCalledWith(false);

    await connection.dispose();
  });

  test("InputVolumeMetersの入力を通知する", async () => {
    const fake = new FakeObs();
    const onInputVolumeMeters = vi.fn();
    const connection = createObsConnection(fake, { onInputVolumeMeters });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();
    const inputs = [{ inputName: "マイク", inputLevelsMul: [[0, 0, 0]] }];
    fake.emit("InputVolumeMeters", { inputs });

    expect(onInputVolumeMeters).toHaveBeenCalledWith(inputs);

    await connection.dispose();
  });

  test("StreamStateChangedの配信状態を通知する", async () => {
    const fake = new FakeObs();
    const onStreamStateChanged = vi.fn();
    const connection = createObsConnection(fake, { onStreamStateChanged });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();
    fake.emit("StreamStateChanged", {
      outputActive: true,
      outputState: "OBS_WEBSOCKET_OUTPUT_STARTED",
    });

    expect(onStreamStateChanged).toHaveBeenCalledWith(true);

    await connection.dispose();
  });

  test("ConnectionClosedで切断を通知して再接続する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    const onConnected = vi.fn();
    const connection = createObsConnection(fake, { onConnected });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();
    expect(onConnected).toHaveBeenLastCalledWith(true);

    fake.emit("ConnectionClosed", new Error("closed"));

    expect(onConnected).toHaveBeenLastCalledWith(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(fake.connect).toHaveBeenCalledTimes(2);

    await connection.dispose();
  });

  test("接続失敗時は1秒後に再接続する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.connect.mockRejectedValueOnce(new Error("refused"));
    const connection = createObsConnection(fake);

    await connection.start();
    expect(fake.connect).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(fake.connect).toHaveBeenCalledTimes(2);
    await connection.dispose();
  });

  test("disposeで再接続タイマーを止める", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.connect.mockRejectedValue(new Error("refused"));
    const connection = createObsConnection(fake);

    await connection.start();
    await connection.dispose();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(fake.connect).toHaveBeenCalledTimes(1);
  });

  test("接続中にdisposeすると接続完了後に切断する", async () => {
    const fake = new FakeObs();
    let resolveConnect = () => {};
    fake.connect.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveConnect = resolve;
        }),
    );
    const onConnected = vi.fn();
    const connection = createObsConnection(fake, { onConnected });

    const started = connection.start();
    const disposing = connection.dispose();
    resolveConnect();
    await disposing;
    await started;

    expect(onConnected).toHaveBeenLastCalledWith(false);
    expect(fake.disconnect).toHaveBeenCalled();
  });

  test("disposeで購読を解除する", async () => {
    const fake = new FakeObs();
    const onInputVolumeMeters = vi.fn();
    const connection = createObsConnection(fake, { onInputVolumeMeters });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();
    await connection.dispose();

    fake.emit("InputVolumeMeters", { inputs: [] });

    expect(onInputVolumeMeters).not.toHaveBeenCalled();
  });

  test("disposeで切断を通知する", async () => {
    const fake = new FakeObs();
    const onConnected = vi.fn();
    const connection = createObsConnection(fake, { onConnected });

    await connection.start();
    fake.emit("Identified");
    await flushPromises();
    expect(onConnected).toHaveBeenLastCalledWith(true);

    await connection.dispose();

    expect(onConnected).toHaveBeenLastCalledWith(false);
  });
});
