import { io } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";
import { describe, expect, test } from "vitest";
import { main } from "../src/index.ts";

const host = "0.0.0.0";
const port = 5000;
main(host, port);

describe("hub:", () => {
  test("クライアントが接続する", async () => {
    const name = `http://${host}:${port}`;
    console.log(name);
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
});
