import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  ObsAudioInputs,
  type ObsAudioInputsOptions,
} from "../src/obs_audio_inputs.js";
import { createObsConnection, FakeObs } from "./fake_obs.js";

const createInputs = (fake: FakeObs, options: ObsAudioInputsOptions = {}) =>
  new ObsAudioInputs(createObsConnection(fake), options);

describe("ObsAudioInputs", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("resolveDesktopはデスクトップ音声名だけを解決する", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake);

    await inputs.resolveDesktop();

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(inputs.desktopInputName).toBe("デスクトップ音声");
    expect(inputs.micInputName).toBeNull();
  });

  test("resolveMicはマイク音声名だけを解決する", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake);

    await inputs.resolveMic();

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(inputs.micInputName).toBe("マイク");
    expect(inputs.desktopInputName).toBeNull();
  });

  test("デスクトップ音声とマイク音声を指定した場合はGetSpecialInputsを呼ばない", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake, {
      desktopInputName: "カスタム音声",
      micInputName: "カスタムマイク",
    });

    await inputs.resolveDesktop();
    await inputs.resolveMic();

    expect(fake.call).not.toHaveBeenCalled();
    expect(inputs.desktopInputName).toBe("カスタム音声");
    expect(inputs.micInputName).toBe("カスタムマイク");
  });

  test("指定した入力名は保持し、未指定の入力名だけを解決する", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake, { desktopInputName: "カスタム音声" });

    await inputs.resolveMic();

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(inputs.desktopInputName).toBe("カスタム音声");
    expect(inputs.micInputName).toBe("マイク");
  });

  test("desktop解決後のmic解決は取得結果を再利用する", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake);

    await inputs.resolveDesktop();
    await inputs.resolveMic();

    expect(inputs.desktopInputName).toBe("デスクトップ音声");
    expect(inputs.micInputName).toBe("マイク");
    expect(fake.call).toHaveBeenCalledTimes(1);
  });

  test("空白のみの入力名は未指定として解決する", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake, {
      desktopInputName: " ",
      micInputName: " ",
    });

    await inputs.resolveDesktop();
    await inputs.resolveMic();

    expect(inputs.desktopInputName).toBe("デスクトップ音声");
    expect(inputs.micInputName).toBe("マイク");
  });

  test("desktop1が空の場合はdesktop2を使う", async () => {
    const fake = new FakeObs();
    fake.specialInputs = {
      desktop1: "",
      desktop2: "デスクトップ音声 2",
      mic1: "マイク",
      mic2: "",
      mic3: "",
      mic4: "",
    };
    const inputs = createInputs(fake);

    await inputs.resolveDesktop();

    expect(inputs.desktopInputName).toBe("デスクトップ音声 2");
  });

  test("mic1が空の場合はmic2を使う", async () => {
    const fake = new FakeObs();
    fake.specialInputs = {
      desktop1: "デスクトップ音声",
      desktop2: "",
      mic1: "",
      mic2: "マイク 2",
      mic3: "",
      mic4: "",
    };
    const inputs = createInputs(fake);

    await inputs.resolveMic();

    expect(inputs.micInputName).toBe("マイク 2");
  });

  test("マイク音声が見つからない場合はnullになる", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.specialInputs = {
      desktop1: "デスクトップ音声",
      desktop2: "",
      mic1: "",
      mic2: "",
      mic3: "",
      mic4: "",
    };
    const inputs = createInputs(fake);

    await inputs.resolveMic();

    expect(inputs.micInputName).toBeNull();
    expect(error).toHaveBeenCalled();
  });

  test("見つからない場合のメッセージに指定方法のヒントを含める", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.specialInputs = {
      desktop1: "",
      desktop2: "",
      mic1: "マイク",
      mic2: "",
      mic3: "",
      mic4: "",
    };
    const inputs = createInputs(fake, {
      desktopInputHint: "--obs-inputで指定してください",
    });

    await inputs.resolveDesktop();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("--obs-inputで指定してください"),
    );
  });

  test("音声ソースの取得に失敗した場合はnullのままにする", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.call.mockRejectedValueOnce(new Error("failed"));
    const inputs = createInputs(fake);

    await inputs.resolveDesktop();

    expect(inputs.desktopInputName).toBeNull();
    expect(inputs.micInputName).toBeNull();
    expect(error).toHaveBeenCalled();
  });

  test("解決済みならGetSpecialInputsを再度呼ばない", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake);

    await inputs.resolveDesktop();
    await inputs.resolveDesktop();

    expect(fake.call).toHaveBeenCalledTimes(1);
  });

  test("同時に解決してもGetSpecialInputsを1回だけ呼ぶ", async () => {
    const fake = new FakeObs();
    const inputs = createInputs(fake);

    await Promise.all([inputs.resolveDesktop(), inputs.resolveMic()]);

    expect(fake.call).toHaveBeenCalledTimes(1);
  });

  test("音声ソースが見つからなかった場合は次の解決で再取得する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.specialInputs = {
      desktop1: "デスクトップ音声",
      desktop2: "",
      mic1: "",
      mic2: "",
      mic3: "",
      mic4: "",
    };
    const inputs = createInputs(fake);

    await inputs.resolveMic();
    expect(inputs.micInputName).toBeNull();

    fake.specialInputs = {
      desktop1: "デスクトップ音声",
      desktop2: "",
      mic1: "マイク",
      mic2: "",
      mic3: "",
      mic4: "",
    };
    await inputs.resolveMic();

    expect(inputs.micInputName).toBe("マイク");
    expect(fake.call).toHaveBeenCalledTimes(2);
  });

  test("解決に失敗した場合は次の解決で再試行する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = new FakeObs();
    fake.call.mockRejectedValueOnce(new Error("failed"));
    const inputs = createInputs(fake);

    await inputs.resolveMic();
    expect(inputs.micInputName).toBeNull();

    await inputs.resolveMic();

    expect(inputs.micInputName).toBe("マイク");
    expect(fake.call).toHaveBeenCalledTimes(2);
  });
});
