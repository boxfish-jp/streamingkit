import { EventEmitter } from "node:events";
import type { Server as HttpServer } from "node:http";
import { type ServerType, serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Message } from "kit_models";
import { Server as SocketServer } from "socket.io";
import customParser from "socket.io-msgpack-parser";

interface OrchestratorServerMessages {
  message: [message: Message];
}

export class OrchestratorServer extends EventEmitter<OrchestratorServerMessages> {
  private _app = new Hono();
  private _serve: ServerType;
  private _socketServer: SocketServer;

  constructor(hostname: string, port: number) {
    super();
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
      parser: customParser,
    });

    this._socketServer.on("message", (message) => {
      this.emit("message", message);
    });

    this._app.get("/", (c) => c.text("Orchestrator Server is running"));
  }

  emitMessage(message: Message) {
    console.log("Emitting message:", message.type);
    this._socketServer.emit("message", message);
  }
}
