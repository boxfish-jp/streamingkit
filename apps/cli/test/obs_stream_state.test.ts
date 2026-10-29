import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ObsStreamState } from "../src/obs_stream_state.js";
import { createObsConnection, FakeObs, flushPromises } from "./fake_obs.js";

const createStreamState = (
  fake: FakeObs,
  onChanged: (isStreaming: boolean) => void,
) => new ObsStreamState(createObsConnection(fake), { onChanged });

describe("ObsStreamState", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("接続通知で配信状態を同期する", async () => {
    const fake = new FakeObs();
    fake.streamOutputActive = true;
    const onChanged = vi.fn();
    createStreamState(fake, onChanged);

    fake.emit("Identified");
    await flushPromises();

    expect(onChanged).toHaveBeenCalledWith(true);
  });

  test("syncで取得した配信状態を通知する", async () => {
    const fake = new FakeObs();
    fake.streamOutputActive = true;
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    await state.sync();

    expect(fake.call).toHaveBeenCalledWith("GetStreamStatus", undefined);
    expect(onChanged).toHaveBeenCalledWith(true);
    expect(state.isStreaming).toBe(true);
  });

  test("同じ配信状態は重複して通知しない", async () => {
    const fake = new FakeObs();
    fake.streamOutputActive = true;
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    await state.sync();
    await state.sync();

    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  test("StreamStateChangedの配信状態を通知する", () => {
    const fake = new FakeObs();
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    state.handleStreamStateChanged(true);

    expect(onChanged).toHaveBeenCalledWith(true);
  });

  test("切断時は配信中ならfalseを通知する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.streamOutputActive = true;
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    fake.emit("Identified");
    await flushPromises();
    expect(state.isStreaming).toBe(true);

    fake.emit("ConnectionClosed", new Error("closed"));

    expect(onChanged).toHaveBeenLastCalledWith(false);
    expect(state.isStreaming).toBe(false);
  });

  test("配信状態の取得に失敗しても例外を投げない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.call.mockRejectedValueOnce(new Error("failed"));
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    await expect(state.sync()).resolves.toBeUndefined();

    expect(onChanged).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  test("dispose後は通知しない", async () => {
    const fake = new FakeObs();
    const onChanged = vi.fn();
    const state = createStreamState(fake, onChanged);

    state.dispose();
    state.handleStreamStateChanged(true);
    fake.emit("Identified");
    await flushPromises();

    expect(onChanged).not.toHaveBeenCalled();
  });
});
