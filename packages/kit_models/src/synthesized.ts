import type { SynthesizeTag } from "./synthesize_tag";

export interface SynthesizedMessage {
  type: "synthesized";
  tag: SynthesizeTag;
  buffer: Buffer;
}

export type OnSynthesized<T> = (message: SynthesizedMessage) => T;
