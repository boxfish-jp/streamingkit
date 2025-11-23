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
