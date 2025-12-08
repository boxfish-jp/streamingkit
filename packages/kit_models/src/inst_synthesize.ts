import type { SynthesizeTag } from "./synthesize_tag";

export interface InstSyntesizeMessage {
  type: "instSynthesize";
  content: string;
  tag: SynthesizeTag;
}
