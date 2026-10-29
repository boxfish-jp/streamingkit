import type { ObsAudioInputs } from "./obs_audio_inputs.js";

const MIC_PEAK_VALUE_INDEX = 2;

interface InputVolumeMeter {
  inputName: string;
  inputLevelsMul: unknown[];
}

const isInputVolumeMeter = (input: unknown): input is InputVolumeMeter =>
  typeof input === "object" &&
  input !== null &&
  "inputName" in input &&
  typeof input.inputName === "string" &&
  "inputLevelsMul" in input &&
  Array.isArray(input.inputLevelsMul);

const extractMicPeak = (
  inputs: unknown[],
  micInputName: string,
): number | null => {
  const meter = inputs.find(
    (input): input is InputVolumeMeter =>
      isInputVolumeMeter(input) && input.inputName === micInputName,
  );
  if (!meter) return null;
  const channelPeaks = meter.inputLevelsMul.map((channel) => {
    if (!Array.isArray(channel)) return 0;
    const peak = channel[MIC_PEAK_VALUE_INDEX];
    return typeof peak === "number" ? peak : 0;
  });
  return Math.max(0, ...channelPeaks);
};

export interface ObsMicMeterOptions {
  onPeak?: (peak: number) => void;
}

export class ObsMicMeter {
  private _inputs: ObsAudioInputs;
  private _onPeak?: (peak: number) => void;

  constructor(inputs: ObsAudioInputs, options: ObsMicMeterOptions = {}) {
    this._inputs = inputs;
    this._onPeak = options.onPeak;
  }

  handleMeters = (inputs: unknown[]) => {
    const micInputName = this._inputs.micInputName;
    if (!micInputName) return;
    const peak = extractMicPeak(inputs, micInputName);
    if (peak === null) return;
    this._onPeak?.(peak);
  };
}
