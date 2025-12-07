export interface SynthesizedMessage {
  type: "synthesized";
  buffer: Buffer;
}

export type NotifySynthesized = (message: SynthesizedMessage) => void;
