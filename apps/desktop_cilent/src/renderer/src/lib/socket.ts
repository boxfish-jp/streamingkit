import type { Message, OnSynthesized } from "kit_models";
import { io } from "socket.io-client";

export const connectSocket = (onSynthesized: OnSynthesized<Promise<void>>) => {
  const socket = io("http://localhost:8888", { path: "/ws" });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("message", async (message: Message) => {
    console.log("Received message:", message);
    switch (message.type) {
      case "synthesized":
        await onSynthesized(message);
        break;
    }
  });
};
