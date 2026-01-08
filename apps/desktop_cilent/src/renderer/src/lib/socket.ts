import type { Message } from "kit_models";
import { io, type Socket } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";

export class SocketManager {
  private _serverUrl: string;
  private static _instance: SocketManager;
  private _onMessageCallbacks: Array<(message: Message) => void> = [];
  private _socket: Socket;

  private constructor() {
    this._serverUrl = this._readUrlFromStorage();
  }

  get serverUrl(): string {
    return this._serverUrl;
  }

  public setServerUrl(url: string) {
    this._saveUrlToStorage(url);
    this._serverUrl = url;
    this._socket.close();
    this.connect();
  }

  private _readUrlFromStorage(): string {
    const item = localStorage.getItem("orchestratorUrl");
    console.log("Read orchestratorUrl from storage:", item);
    return item ?? "http://localhost:8888";
  }

  private _saveUrlToStorage(url: string) {
    localStorage.setItem("orchestratorUrl", url);
    console.log("Saved orchestratorUrl to storage:", url);
  }
  private _emit(message: Message) {
    this._onMessageCallbacks.forEach((callback) => {
      callback(message);
    });
  }

  public on(callback: (message: Message) => void) {
    this._onMessageCallbacks.push(callback);
  }

  static instance(): SocketManager {
    if (!SocketManager._instance) {
      SocketManager._instance = new SocketManager();
    }
    return SocketManager._instance;
  }

  public connect() {
    this._socket = io(this._serverUrl, {
      path: "/ws",
      parser: customParser,
    });

    this._socket.on("connect", async () => {
      console.log("Socket connected:", this._socket.id);
      this._emit({
        type: "notify",
        status: "clientSocketConnected",
      });
    });

    this._socket.on("message", async (message: Message) => {
      console.log("Received message:", message);
      this._emit(message);
    });

    this._socket.on("disconnect", async () => {
      this._emit({
        type: "error",
        status: "clientSocketDisconnected",
        time: Date.now(),
      });
    });

    this._socket.on("connect_error", async (err) => {
      this._emit({
        type: "error",
        status: "clientSocketConnection",
        time: Date.now(),
      });
      console.log("接続エラーが発生しました:", err.message);
    });
  }
}
