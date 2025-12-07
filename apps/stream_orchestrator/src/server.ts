import type { Server as HttpServer } from "node:http";
import { type ServerType, serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Server as SocketServer } from "socket.io";
import type { Message } from "./model/message.js";

export class OrchestratorServer {
  private _app = new Hono();
  private _serve: ServerType;
  private _socketServer: SocketServer;
  private _onMessageCallbacks: Array<(message: Message) => void> = [];

  registerOnMessage(callback: (message: Message) => void) {
    this._onMessageCallbacks.push(callback);
  }

  removeOnMessage(callback: (message: Message) => void) {
    this._onMessageCallbacks = this._onMessageCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  constructor(hostname: string, port: number) {
    this._app.use(
      "/*",
      cors({
        origin: "*",
        allowMethods: ["GET", "POST"],
      }),
    );

    this._serve = serve(
      {
        fetch: this._app.fetch,
        hostname: hostname,
        port: port,
      },
      (info) => {
        console.log(
          `server is running on  http://${info.address}:${info.port}`,
        );
      },
    );
    this._socketServer = new SocketServer(this._serve as HttpServer, {
      path: "/ws",
      serveClient: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this._socketServer.on("message", (message) => {
      this._onMessageCallbacks.forEach((cb) => cb(message));
    });
  }

  emitMessage(message: Message) {
    this._socketServer.emit("message", message);
  }
}
