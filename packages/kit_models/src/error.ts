export interface ErrorMessage {
  type: "error";
  status: "clientSocketConnection" | "clientSocketDisconnected";
  time: number;
}

export type NotifyError = (error: string) => void;
