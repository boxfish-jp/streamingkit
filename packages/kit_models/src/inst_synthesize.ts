import type { SynthesizeTag } from "./synthesize_tag";

export interface InstSyntesizeMessage {
  type: "instSyntesize";
  content: string;
  tag: SynthesizeTag;
}
