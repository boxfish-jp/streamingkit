export interface ErrorMessage {
  type: "error";
  status:
    | "clientSocketConnection"
    | "clientSocketDisconnected"
    | "serverStopComment"
    | "serverWatchComment";
  time: number;
  message?: string;
}

export type NotifyError = (error: string) => void;
