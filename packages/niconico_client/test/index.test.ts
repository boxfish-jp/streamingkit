import type { Message } from "kit_models";
import { describe, expect, test } from "vitest";
import { NicoNicoClient } from "../src/index.js";

const HEADLESS_BROWSER_URL = "http://192.168.68.15:3000";

describe("listenComment", () => {
  describe("start:", () => {
    test("無効な生放送IDを入れるとエラーが出る", async () => {
      const listenComment = new NicoNicoClient("", HEADLESS_BROWSER_URL);
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

  describe("getStreamingId", () => {
    test("配信しているときは生放送IDが返る", async () => {
      const response = await fetch(
        "https://live.nicovideo.jp/watch/user/70969122",
      );
      const id = response.headers.get("x-nicolive-content-id");
      expect(id).toBeDefined();
      const client = new NicoNicoClient("70969122", HEADLESS_BROWSER_URL);
      const streamingId = await client.getStreamingId();
      expect(streamingId).toBe(id);
    });

    test("配信していないときはnullが返る", async () => {
      const client = new NicoNicoClient("51801260", HEADLESS_BROWSER_URL);
      const streamingId = await client.getStreamingId();
      expect(streamingId).toBe(null);
    });

    test("onError: Failed to fetch", async () => {
      const streamInfo = new NicoNicoClient("");
      try {
        await streamInfo.getStreamingId();
        throw new Error("Expected getStreamingId to throw an error");
      } catch (error) {
        expect(error instanceof Error ? error.message : error).toBe(
          "failed to get niconico stream id: Failed to fetch: 400",
        );
      }
    });

    test("onError: no status", async () => {
      const streamInfo = new NicoNicoClient("0", HEADLESS_BROWSER_URL);
      try {
        await streamInfo.getStreamingId();
        throw new Error("Expected getStreamingId to throw an error");
      } catch (error) {
        expect(error instanceof Error ? error.message : error).toBe(
          "failed to get niconico stream id: programsList is empty",
        );
      }
    });
  });

  describe("isStreaming:", () => {
    test("true", async () => {
      const streamInfo = new NicoNicoClient("70969122", HEADLESS_BROWSER_URL);
      await streamInfo.getStreamingId();
      expect(streamInfo.isStreaming).toBe(true);
    });

    test("false", async () => {
      const streamInfo = new NicoNicoClient("51801260", HEADLESS_BROWSER_URL);
      await streamInfo.getStreamingId();
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
      const streamInfo = new NicoNicoClient("70969122", HEADLESS_BROWSER_URL);
      await streamInfo.getStreamingId();
      expect(streamInfo.streamLv).toBe(id);
      expect(streamInfo.streamUrl).toBe(
        `https://live.nicovideo.jp/watch/${id}`,
      );
      expect(streamInfo.streamId).toBe(Number(`${id?.replace("lv", "")}`));
    });
  });

  describe("getWebSocketInfo", () => {
    test("配信しているときはurlとvposBaseTimeが返る", async () => {
      const client = new NicoNicoClient("", HEADLESS_BROWSER_URL);
      const info = await client.getWebSocketInfo();
      expect(!!info.vposBaseTime).toBe(true);
      expect(!!info.url).toBe(true);
    });
  });
});
