import type { WavData } from "../wav_data.js";

export interface BusEvent {
  comment: [comment: Comment];
  streamInfo: [isStreaming: boolean, streamId?: number];
  notifySynthesized: [wavData: WavData];
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
}
