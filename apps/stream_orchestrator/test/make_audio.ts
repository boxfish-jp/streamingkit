import { SynthesizeRunner } from "../src/synthesize.js";
import type { SynthesizedMessage } from "../src/types/synthesized.js";
import { WavData } from "../src/wav_data.js";

const makeAudioRunner = new SynthesizeRunner();

const onSynthesized = (message: SynthesizedMessage) => {
  const wavData = new WavData(message.buffer);
  wavData.saveFile();
};
makeAudioRunner.registerOnSynthesized(onSynthesized);

makeAudioRunner.addQueue("これはテストです。");
