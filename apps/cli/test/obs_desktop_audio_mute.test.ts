import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ObsAudioInputs } from "../src/obs_audio_inputs.js";
import {
  ObsDesktopAudioMute,
  type ObsDesktopAudioMuteOptions,
} from "../src/obs_desktop_audio_mute.js";
import { createObsConnection, FakeObs, flushPromises } from "./fake_obs.js";

const createDesktopAudioMute = (
  fake: FakeObs,
  options: ObsDesktopAudioMuteOptions = {},
) => {
  const connection = createObsConnection(fake);
  const inputs = new ObsAudioInputs(connection);
  return new ObsDesktopAudioMute(connection, inputs, options);
};

describe("ObsDesktopAudioMute", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("接続後のミュート要求でデスクトップ音声をミュートする", async () => {
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake);

    await client.syncMuteState();
    await client.setMuted(true);

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
  });

  test("接続通知でミュート状態を同期する", async () => {
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake);

    fake.emit("Identified");
    await flushPromises();
    await client.setMuted(true);

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
  });

  test("接続後の同期ではマイク名を解決しない", async () => {
    const fake = new FakeObs();
    const connection = createObsConnection(fake);
    const inputs = new ObsAudioInputs(connection);
    const client = new ObsDesktopAudioMute(connection, inputs);

    await client.syncMuteState();

    expect(inputs.desktopInputName).toBe("デスクトップ音声");
    expect(inputs.micInputName).toBeNull();
  });

  test("入力名を指定した場合はGetSpecialInputsを呼ばない", async () => {
    const fake = new FakeObs();
    const connection = createObsConnection(fake);
    const inputs = new ObsAudioInputs(connection, {
      desktopInputName: "カスタム音声",
      micInputName: "マイク",
    });
    const client = new ObsDesktopAudioMute(connection, inputs);

    await client.syncMuteState();
    await client.setMuted(true);

    expect(fake.call).not.toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "カスタム音声",
      inputMuted: true,
    });
  });

  test("接続前にsetMutedしても接続後に適用する", async () => {
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake);

    await client.setMuted(true);

    expect(fake.call).not.toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });

    await client.syncMuteState();

    expect(fake.call).toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
  });

  test("ミュート適用後にonMuteAppliedを通知する", async () => {
    const fake = new FakeObs();
    const onMuteApplied = vi.fn();
    const client = createDesktopAudioMute(fake, { onMuteApplied });

    await client.syncMuteState();
    await client.setMuted(true);

    expect(onMuteApplied).toHaveBeenLastCalledWith(true);

    await client.setMuted(false);

    expect(onMuteApplied).toHaveBeenLastCalledWith(false);
    expect(onMuteApplied).toHaveBeenCalledTimes(2);
  });

  test("再接続で同じ状態を再適用するとonMuteAppliedを再度呼び出す", async () => {
    const fake = new FakeObs();
    const onMuteApplied = vi.fn();
    const client = createDesktopAudioMute(fake, { onMuteApplied });

    await client.syncMuteState();
    await client.setMuted(true);
    await client.handleDisconnected();
    await client.syncMuteState();

    const setInputMuteCalls = fake.call.mock.calls.filter(
      ([requestType]) => requestType === "SetInputMute",
    );
    expect(setInputMuteCalls).toHaveLength(2);
    expect(onMuteApplied).toHaveBeenCalledTimes(2);
    expect(onMuteApplied).toHaveBeenNthCalledWith(1, true);
    expect(onMuteApplied).toHaveBeenNthCalledWith(2, true);
  });

  test("同じ値の再要求ではonMuteAppliedを再度呼び出さない", async () => {
    const fake = new FakeObs();
    const onMuteApplied = vi.fn();
    const client = createDesktopAudioMute(fake, { onMuteApplied });

    await client.syncMuteState();
    await client.setMuted(true);
    await client.setMuted(true);

    expect(onMuteApplied).toHaveBeenCalledTimes(1);
    expect(onMuteApplied).toHaveBeenCalledWith(true);
  });

  test("ミュート設定に失敗した場合はonMuteAppliedを通知しない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.call.mockImplementation(async (requestType: string) => {
      if (requestType === "GetSpecialInputs") return fake.specialInputs;
      throw new Error("failed");
    });
    const onMuteApplied = vi.fn();
    const client = createDesktopAudioMute(fake, { onMuteApplied });

    await client.syncMuteState();
    await client.setMuted(true);

    expect(onMuteApplied).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  test("ミュート設定に失敗した場合は次の適用で再試行する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    let shouldFail = true;
    fake.call.mockImplementation(async (requestType: string) => {
      if (requestType === "GetSpecialInputs") return fake.specialInputs;
      if (shouldFail) {
        shouldFail = false;
        throw new Error("failed");
      }
      return {};
    });
    const onMuteApplied = vi.fn();
    const client = createDesktopAudioMute(fake, { onMuteApplied });

    await client.syncMuteState();
    await client.setMuted(true);

    expect(onMuteApplied).not.toHaveBeenCalled();

    await client.setMuted(true);

    expect(onMuteApplied).toHaveBeenCalledWith(true);
  });

  test("接続していない間はミュート設定を適用しない", async () => {
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake);

    await client.handleDisconnected();
    await client.setMuted(true);

    expect(fake.call).not.toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
  });

  test("dispose後はミュート設定を適用しない", async () => {
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake);

    await client.syncMuteState();
    client.dispose();
    await client.setMuted(true);

    expect(fake.call).not.toHaveBeenCalledWith("SetInputMute", {
      inputName: "デスクトップ音声",
      inputMuted: true,
    });
  });

  test("onMuteAppliedが失敗してもsetMutedは例外を投げない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    const client = createDesktopAudioMute(fake, {
      onMuteApplied: () => {
        throw new Error("failed");
      },
    });

    await client.syncMuteState();

    await expect(client.setMuted(true)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});
