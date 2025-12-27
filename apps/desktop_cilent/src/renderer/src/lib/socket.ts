import type { Message } from "kit_models";
import { io } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";

export const connectSocket = (emitMessage: (message: Message) => void) => {
  const socket = io("http://localhost:8888", {
    path: "/ws",
    parser: customParser,
  });

  socket.on("connect", async () => {
    console.log("Socket connected:", socket.id);
    emitMessage({
      type: "notify",
      status: "clientSocketConnected",
    });
  });

  socket.on("message", async (message: Message) => {
    console.log("Received message:", message);
    emitMessage(message);
  });

  socket.on("disconnect", async () => {
    emitMessage({
      type: "error",
      status: "clientSocketDisconnected",
      time: Date.now(),
    });
  });

  socket.on("connect_error", async (err) => {
    emitMessage({
      type: "error",
      status: "clientSocketConnection",
      time: Date.now(),
    });
    console.log("接続エラーが発生しました:", err.message);
  });
};
