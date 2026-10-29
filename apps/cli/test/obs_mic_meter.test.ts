import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ObsAudioInputs } from "../src/obs_audio_inputs.js";
import { ObsMicMeter, type ObsMicMeterOptions } from "../src/obs_mic_meter.js";
import { createObsConnection, FakeObs } from "./fake_obs.js";

const createMicMeter = (fake: FakeObs, options: ObsMicMeterOptions = {}) => {
  const inputs = new ObsAudioInputs(createObsConnection(fake));
  return { inputs, meter: new ObsMicMeter(inputs, options) };
};

describe("ObsMicMeter", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("マイク名を解決できる", async () => {
    const fake = new FakeObs();
    const { inputs } = createMicMeter(fake);

    await inputs.resolveMic();

    expect(fake.call).toHaveBeenCalledWith("GetSpecialInputs", undefined);
    expect(inputs.micInputName).toBe("マイク");
  });

  test("InputVolumeMetersでマイクのピークを通知する", async () => {
    const fake = new FakeObs();
    const onPeak = vi.fn();
    const { inputs, meter } = createMicMeter(fake, { onPeak });

    await inputs.resolveMic();
    meter.handleMeters([
      { inputName: "デスクトップ音声", inputLevelsMul: [[0.5, 0.6, 0.7]] },
      {
        inputName: "マイク",
        inputLevelsMul: [
          [0.1, 0.2, 0.3],
          [0.2, 0.4, 0.6],
        ],
      },
    ]);

    expect(onPeak).toHaveBeenLastCalledWith(0.6);
  });

  test("マイク名を指定した場合はGetSpecialInputsを呼ばない", async () => {
    const fake = new FakeObs();
    const inputs = new ObsAudioInputs(createObsConnection(fake), {
      desktopInputName: "デスクトップ音声",
      micInputName: "マイク",
    });
    const meter = new ObsMicMeter(inputs);

    await inputs.resolveMic();

    expect(fake.call).not.toHaveBeenCalled();
    expect(meter).toBeDefined();
  });

  test("InputVolumeMetersでマイク以外の入力を無視する", async () => {
    const fake = new FakeObs();
    const onPeak = vi.fn();
    const { inputs, meter } = createMicMeter(fake, { onPeak });

    await inputs.resolveMic();
    meter.handleMeters([
      { inputName: "デスクトップ音声", inputLevelsMul: [[0.5, 0.6, 0.7]] },
    ]);

    expect(onPeak).not.toHaveBeenCalled();
  });

  test("InputVolumeMetersの形式が不正な場合は無視する", async () => {
    const fake = new FakeObs();
    const onPeak = vi.fn();
    const { inputs, meter } = createMicMeter(fake, { onPeak });

    await inputs.resolveMic();
    meter.handleMeters([{ inputName: "マイク", inputLevelsMul: "invalid" }]);

    expect(onPeak).not.toHaveBeenCalled();
  });

  test("マイク名を解決する前のInputVolumeMetersは無視する", () => {
    const fake = new FakeObs();
    const onPeak = vi.fn();
    const { meter } = createMicMeter(fake, { onPeak });

    meter.handleMeters([
      { inputName: "マイク", inputLevelsMul: [[0.1, 0.2, 0.3]] },
    ]);

    expect(onPeak).not.toHaveBeenCalled();
  });

  test("マイク音声が見つからない場合はピークを通知しない", async () => {
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
    const onPeak = vi.fn();
    const { inputs, meter } = createMicMeter(fake, { onPeak });

    await inputs.resolveMic();
    meter.handleMeters([
      { inputName: "マイク", inputLevelsMul: [[0.1, 0.2, 0.3]] },
    ]);

    expect(onPeak).not.toHaveBeenCalled();
  });
});
