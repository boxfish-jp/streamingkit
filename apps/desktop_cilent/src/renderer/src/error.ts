import type { ErrorMessage, Message } from "kit_models";
import clientSocketConnectionErrorWav from "./assets/client_socket_connection_error.wav";
import clientSocketDisconectedWav from "./assets/client_socket_disconnected.wav";

export class ErrorHandler {
  private _lastError = { status: "", time: 0 };

  async onError(error: ErrorMessage): Promise<Message | undefined> {
    switch (error.status) {
      case "clientSocketConnection":
        if (
          this._lastError.status !== error.status &&
          this._lastError.time + 60000 < error.time
        ) {
          const response = await fetch(clientSocketConnectionErrorWav);
          this._lastError = { status: error.status, time: Date.now() };
          return {
            type: "synthesized",
            buffer: (await response.arrayBuffer()) as any,
            tag: "announce",
          };
        }
        break;
      case "clientSocketDisconnected":
        if (
          this._lastError.status !== error.status ||
          this._lastError.time + 60000 < error.time
        ) {
          const response = await fetch(clientSocketDisconectedWav);
          this._lastError = { status: error.status, time: Date.now() };
          return {
            type: "synthesized",
            buffer: (await response.arrayBuffer()) as any,
            tag: "announce",
          };
        }
        break;
    }
  }
}
