export interface SynthesizedMessage {
  type: "synthesized";
  buffer: Uint8Array;
  channel: number;
}

export type OnSynthesized<T> = (message: SynthesizedMessage) => T;
