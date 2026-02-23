import { io } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";
import { describe, expect, test } from "vitest";
import { main } from "../src/index.ts";

const host = "0.0.0.0";
const port = 5000;
const name = `http://${host}:${port}`;
main(host, port);

describe("hub:", () => {
  test("クライアントが接続する", async () => {
    const socket = io(name, {
      path: "/ws",
      parser: customParser,
    });
    await new Promise<void>((resolve) => {
      socket.on("connect", () => {
        socket.disconnect();
        resolve();
      });
    });
  });

  test("クライアントが送信したメッセージはブロードキャストされる", async () => {
    const clientA = io(name, {
      path: "/ws",
      parser: customParser,
    });

    const clientB = io(name, {
      path: "/ws",
      parser: customParser,
    });

    await new Promise<void>((resolve) => {
      clientA.on("connect", () => {
        clientA.emit("message", "hello");
      });
      clientB.on("message", (message) => {
        expect(message).toBe("hello");
        clientA.disconnect();
        clientB.disconnect();
        resolve();
      });
    });
  });

  test("クライアントが送信したメッセージはブロードキャストされるが、自分が送ったメッセージは返ってこない", async () => {
    const clientA = io(name, {
      path: "/ws",
      parser: customParser,
    });

    const clientB = io(name, {
      path: "/ws",
      parser: customParser,
    });

    await new Promise<void>((resolve) => {
      clientA.on("connect", () => {
        clientA.emit("message", "hello");
      });

      clientA.on("message", (message) => {
        if (!message) return;
        expect(message).toEqual("hello from B");
        clientA.disconnect();
        clientB.disconnect();
        resolve();
      });

      clientB.on("message", (message) => {
        clientB.emit("message", "hello from B");
      });
    });
  });
});
