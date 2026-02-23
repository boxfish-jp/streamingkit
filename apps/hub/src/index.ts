import type { Server as HttpServer } from "node:http";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Server as SocketServer } from "socket.io";
import customParser from "socket.io-msgpack-parser";

export const main = (name: string, port: number) => {
  const app = new Hono();

  app.use(
    "/*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST"],
    }),
  );

  const nodeServer = serve(
    {
      fetch: app.fetch,
      hostname: name,
      port: port,
    },
    (info) => {
      console.log(`server is running on  http://${info.address}:${info.port}`);
    },
  );

  const socketServer = new SocketServer(nodeServer as HttpServer, {
    path: "/ws",
    serveClient: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    parser: customParser,
  });

  socketServer.on("connect", (socket) => {
    socket.on("message", (message: unknown) => {
      socket.broadcast.emit("message", message);
    });
  });

  app.get("/", (c) => c.text("Orchestrator Server is running"));
};

main("0.0.0.0", 8888);
