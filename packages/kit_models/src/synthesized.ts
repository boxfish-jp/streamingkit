import type { SynthesizeTag } from "./synthesize_tag.js";

export interface SynthesizedMessage {
  type: "synthesized";
  tag: SynthesizeTag;
  buffer: Buffer;
  channel?: number;
}

export type OnSynthesized<T> = (message: SynthesizedMessage) => T;
