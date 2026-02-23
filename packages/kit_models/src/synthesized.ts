export interface SynthesizedMessage {
  type: "synthesized";
  buffer: Buffer;
  channel: number;
}

export type OnSynthesized<T> = (message: SynthesizedMessage) => T;
