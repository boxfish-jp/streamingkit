import { EventEmitter } from "event_emitter";
import type { Message } from "kit_models";
import { io, type Socket } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";

interface SocketClientEvent {
  connect: [id: string | undefined];
  message: [message: Message];
  disconnect: [];
  connect_error: [status: string, messge: Error];
}

export class SocketClient extends EventEmitter<SocketClientEvent> {
  private _serverUrl = "http://localhost:8888";
  private static _instance: SocketClient;
  private _socket: Socket | null = null;

  static instance(): SocketClient {
    if (!SocketClient._instance) {
      SocketClient._instance = new SocketClient();
    }
    return SocketClient._instance;
  }

  get serverUrl(): string {
    return this._serverUrl;
  }

  public setServerUrl(url: string) {
    this._serverUrl = url;
    this.connect();
  }

  get isConnected(): boolean {
    return this._socket?.connected ?? false;
  }

  public connect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this._socket = io(this._serverUrl, {
      path: "/ws",
      parser: customParser,
    });

    this._socket.on("connect", () => {
      if (!this._socket) return;
      this.emit("connect", this._socket.id);
    });

    this._socket.on("message", (message: Message) => {
      this.emit("message", message);
    });

    this._socket.on("disconnect", () => {
      this.emit("disconnect");
    });

    this._socket.on("connect_error", (err) => {
      this.emit("connect_error", "clientSocketConnection", err);
    });
  }

  public disconnect() {
    this._socket?.disconnect();
  }

  emitMessage(message: Message) {
    this._socket?.emit("message", message);
  }
}
