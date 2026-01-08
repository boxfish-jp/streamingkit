import type { SynthesizeTag } from "./synthesize_tag.js";

export interface InstSyntesizeMessage {
  type: "instSynthesize";
  content: string;
  tag: SynthesizeTag;
}
