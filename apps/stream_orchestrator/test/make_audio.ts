import { MakeAudioRunner } from "../src/make_audio.js";
import type { WavData } from "../src/wav_data.js";

const makeAudioRunner = new MakeAudioRunner();

const onSynthesized = (wavData: WavData) => {
  wavData.saveFile();
};
makeAudioRunner.registerOnSynthesized(onSynthesized);

makeAudioRunner.addQueue("これはテストです。");
