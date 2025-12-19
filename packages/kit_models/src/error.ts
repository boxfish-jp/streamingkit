export interface ErrorMessage {
  type: "error";
  status:
    | "clientSocketConnection"
    | "clientSocketDisconnected"
    | "serverStopComment"
    | "serverWatchComment"
    | "serverGetStreamInfo"
    | "serverSynthesize"
    | "serverSynthesizeDelay"
    | "serverReadEducation"
    | "serverWriteEducation";
  time: number;
  message?: string;
}

export type NotifyError = (error: string) => void;
