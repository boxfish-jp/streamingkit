import type { Message } from "kit_models";
import { describe, expect, test } from "vitest";
import { NicoNicoClient } from "../src/index.js";

describe("listenComment", () => {
  describe("start:", () => {
    test("無効な生放送IDを入れるとエラーが出る", async () => {
      const listenComment = new NicoNicoClient("");
      const callback = (message: Message) => {
        if (message.type !== "error") {
          throw new Error("Expected an error message");
        }
        expect(message.status).toBe("serverWatchComment");
      };
      listenComment.on("message", callback);
      listenComment.start("0");
      // 200ms待つ
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  });

  describe("isStreaming:", () => {
    test("true", async () => {
      const streamInfo = new NicoNicoClient("70969122");
      await streamInfo.checkStreaming();
      expect(streamInfo.isStreaming).toBe(true);
    });

    test("false", async () => {
      const streamInfo = new NicoNicoClient("51801260");
      await streamInfo.checkStreaming();
      expect(streamInfo.isStreaming).toBe(false);
    });
  });

  describe("getstreamUrl: getstreamId:", () => {
    test("getStreamInfo: streamingUrl", async () => {
      const response = await fetch(
        "https://live.nicovideo.jp/watch/user/70969122",
      );
      const id = response.headers.get("x-nicolive-content-id");
      expect(id).toBeDefined();
      const streamInfo = new NicoNicoClient("70969122");
      await streamInfo.checkStreaming();
      expect(streamInfo.streamLv).toBe(id);
      expect(streamInfo.streamUrl).toBe(
        `https://live.nicovideo.jp/watch/${id}`,
      );
      expect(streamInfo.streamId).toBe(Number(`${id?.replace("lv", "")}`));
    });
  });

  describe("callback:", () => {
    test("streaming_info", async () => {
      const response = await fetch(
        "https://live.nicovideo.jp/watch/user/70969122",
      );
      const id = response.headers.get("x-nicolive-content-id");
      expect(id).toBeDefined();
      const streamInfo = new NicoNicoClient("70969122");
      let callCount = 0;
      const callback = (message: Message) => {
        if (message.type !== "streaming_info") {
          throw new Error("Expected a streaming_info message");
        }
        callCount++;
        expect(message.isStreaming).toBe(true);
        expect(message.streamId).toBe(Number(`${id?.replace("lv", "")}`));
      };
      streamInfo.on("message", callback);
      await streamInfo.checkStreaming();
      // 200ms待つ
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(callCount).toBe(1);
      //streamInfo.removeNotifyCallback(callback);
    });

    test("onError: Failed to fetch", async () => {
      const streamInfo = new NicoNicoClient("");
      const callback = (error: Message) => {
        if (error.type === "streaming_info") {
          return;
        }
        if (error.type !== "error") {
          throw new Error("Expected an error message");
        }
        expect(error.message).toBe("Error: Failed to fetch: 400");
      };
      streamInfo.on("message", callback);
      await streamInfo.checkStreaming();
      // 200ms待つ
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    test("onError: no status", async () => {
      const streamInfo = new NicoNicoClient("0");
      const callback = (error: Message) => {
        if (error.type === "streaming_info") {
          return;
        }
        if (error.type !== "error") {
          throw new Error("Expected an error message");
        }
        expect(error.message).toBe(
          "Error: response does not contain programsList",
        );
      };
      streamInfo.on("message", callback);
      await streamInfo.checkStreaming();
      // 200ms待つ
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  });
});
