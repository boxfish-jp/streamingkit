export interface BusEvent {
  comment: [comment: Comment];
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
