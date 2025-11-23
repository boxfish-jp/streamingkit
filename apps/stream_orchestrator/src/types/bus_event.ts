import type { StreamStatus } from "./stream_status.js";

export interface BusEvent {
  comment: [who: string, content: string];
  statusStream: [status: StreamStatus];
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
