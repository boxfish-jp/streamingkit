import { expect, test } from "vitest";
import { StreamInfo } from "../src/stream_info.js";

test("getStreamInfo: isStreamingTrue", async () => {
  const streamInfo = new StreamInfo("70969122");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.isStreaming).toBe(true);
});

test("getStreamInfo: isStreamingFalse", async () => {
  const streamInfo = new StreamInfo("51801260");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.isStreaming).toBe(false);
});

test("getStreamInfo: streamingUrl", async () => {
  const response = await fetch("https://live.nicovideo.jp/watch/user/70969122");
  const id = response.headers.get("x-nicolive-content-id");
  expect(id).toBeDefined();
  const streamInfo = new StreamInfo("70969122");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.streamLv).toBe(id);
  expect(streamInfo.streamUrl).toBe(`https://live.nicovideo.jp/watch/${id}`);
  expect(streamInfo.streamId).toBe(Number(`${id?.replace("lv", "")}`));
});
