import type { CommentMessage } from "./comment.js";
import type { ErrorMessage } from "./error.js";
import type { InstSyntesizeMessage } from "./inst_synthesize.js";
import type { NotifyMessage } from "./notify.js";
import type { StreamInfoMessage } from "./stream_info.js";
import type { SynthesizedMessage } from "./synthesized.js";
import type { VideoMessage } from "./video.js";

export type Message =
  | CommentMessage
  | StreamInfoMessage
  | SynthesizedMessage
  | InstSyntesizeMessage
  | ErrorMessage
  | NotifyMessage
  | VideoMessage;

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
