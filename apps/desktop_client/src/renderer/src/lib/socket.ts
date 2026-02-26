import type { Message } from "kit_models";
import { SocketClient } from "socket_client";

export class SocketManager {
  private static _instance: SocketManager;
  private _socket = new SocketClient();
  private _onMessageCallbacks: ((message: Message) => void)[] = [];

  static instance(): SocketManager {
    if (!SocketManager._instance) {
      SocketManager._instance = new SocketManager();
    }
    return SocketManager._instance;
  }

  private constructor() {
    const item = localStorage.getItem("orchestratorUrl");
    console.log("Read orchestratorUrl from storage:", item);
    const url = item ?? "http://localhost:8888";
    this._socket.setServerUrl(url);
    this._initEventListeners();
    this.connect();
  }

  get serverUrl(): string {
    return this._socket.serverUrl;
  }

  public setServerUrl(url: string) {
    localStorage.setItem("orchestratorUrl", url);
    console.log("Saved orchestratorUrl to storage:", url);
    if (this._socket.isConnected) {
      this._socket.disconnect();
    }
    this._socket.setServerUrl(url);
  }

  public connect() {
    this._socket.connect();
  }

  public onMessage(callback: (message: Message) => void) {
    this._onMessageCallbacks.push(callback);
    console.log(
      "Registered new onMessage callback. Total callbacks:",
      this._onMessageCallbacks.length,
    );
  }

  private _emitMessage(message: Message) {
    this._onMessageCallbacks.forEach((callback) => callback(message));
  }

  private _initEventListeners() {
    this._socket.on("message", (message) => {
      this._emitMessage(message);
    });

    this._socket.on("connect", () => {
      this._emitMessage({
        type: "notify",
        status: "clientSocketConnected",
      } as Message);
    });

    this._socket.on("disconnect", () => {
      this._emitMessage({
        type: "error",
        status: "clientSocketDisconnected",
        time: Date.now(),
      } as Message);
    });

    this._socket.on("connect_error", () => {
      this._emitMessage({
        type: "error",
        status: "clientSocketConnection",
        time: Date.now(),
      } as Message);
    });
  }
}
