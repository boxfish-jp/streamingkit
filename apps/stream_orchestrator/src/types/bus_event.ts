import type { WavData } from "../wav_data.js";
import type { Comment } from "./comment.js";
import type { StreamInfo } from "./stream_info.js";

interface CommentMessage {
  type: "comment";
  message: Comment;
}

interface StreamiInfoMessage {
  type: "streaming_info";
  message: StreamInfo;
}

interface SynthesizedMessage {
  type: "synthesized";
  message: WavData;
}

export type Message = CommentMessage | StreamiInfoMessage | SynthesizedMessage;

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
