import type { CommentMessage } from "./comment.js";
import type { InstSyntesizeMessage } from "./inst_synthesize.js";
import type { StreamInfoMessage } from "./stream_info.js";
import type { SynthesizedMessage } from "./synthesized.js";

export type Message =
  | CommentMessage
  | StreamInfoMessage
  | SynthesizedMessage
  | InstSyntesizeMessage;

/*
  statusComment: never;
  statusMakeAudio: never;
  instSubtitle: never;
  instMakeAudio: never;
  instVideo: never;
  instEducation: never;
  instSendAudio: never;
  instSendNotification: never;
  */
