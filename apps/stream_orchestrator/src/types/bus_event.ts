export interface BusEvent {
  comment: [who: string, content: string];
  streamInfo: [isStreaming: boolean, streamId?: number];
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
