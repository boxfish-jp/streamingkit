import type { CommentMessage } from "./comment.js";
import type { ConnectionMessage } from "./connection.js";
import type {
  AddEducationMessage,
  RemoveEducationMessage,
} from "./education.js";
import type { ErrorMessage } from "./error.js";
import type { InstSyntesizeMessage } from "./inst_synthesize.js";
import type { NotifyMessage } from "./notify.js";
import type { PingMessage } from "./ping.js";
import type { SpotifyMessage } from "./spotify.js";
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
  | VideoMessage
  | AddEducationMessage
  | RemoveEducationMessage
  | SpotifyMessage
  | PingMessage
  | ConnectionMessage;

export type OnMessage = (message: Message) => void;

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
