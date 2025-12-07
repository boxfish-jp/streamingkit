import type { NotifyError, StreamInfoMessage } from "kit_models";
import { expect, test } from "vitest";
import { CheckStreamInfo } from "../src/check_stream_info.js";

test("getStreamInfo: isStreamingTrue", async () => {
  const streamInfo = new CheckStreamInfo("70969122");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.isStreaming).toBe(true);
});

test("getStreamInfo: isStreamingFalse", async () => {
  const streamInfo = new CheckStreamInfo("51801260");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.isStreaming).toBe(false);
});

test("getStreamInfo: streamingUrl", async () => {
  const response = await fetch("https://live.nicovideo.jp/watch/user/70969122");
  const id = response.headers.get("x-nicolive-content-id");
  expect(id).toBeDefined();
  const streamInfo = new CheckStreamInfo("70969122");
  await streamInfo.checkIsStreaming();
  expect(streamInfo.streamLv).toBe(id);
  expect(streamInfo.streamUrl).toBe(`https://live.nicovideo.jp/watch/${id}`);
  expect(streamInfo.streamId).toBe(Number(`${id?.replace("lv", "")}`));
});

test("getStreamInfo: callback", async () => {
  const response = await fetch("https://live.nicovideo.jp/watch/user/70969122");
  const id = response.headers.get("x-nicolive-content-id");
  expect(id).toBeDefined();
  const streamInfo = new CheckStreamInfo("70969122");
  const callback = (info: StreamInfoMessage) => {
    expect(info.isStreaming).toBe(true);
    expect(info.streamId).toBe(Number(`${id?.replace("lv", "")}`));
  };
  streamInfo.registerNotifyCallback(callback);
  await streamInfo.checkIsStreaming();
  // 200ms待つ
  await new Promise((resolve) => setTimeout(resolve, 200));
  //streamInfo.removeNotifyCallback(callback);
});

test("getStreamInfo: onErrorCallback(fetch error)", async () => {
  const streamInfo = new CheckStreamInfo("");
  const callback: NotifyError = (error) => {
    expect(error).toBe("Error: Failed to fetch: 400");
  };
  streamInfo.registerOnErrorCallback(callback);
  await streamInfo.checkIsStreaming();
  // 200ms待つ
  await new Promise((resolve) => setTimeout(resolve, 200));
});

test("getStreamInfo: onErrorCallback(no status)", async () => {
  const streamInfo = new CheckStreamInfo("0");
  const callback: NotifyError = (error) => {
    expect(error).toBe("Error: No status found in response");
  };
  streamInfo.registerOnErrorCallback(callback);
  await streamInfo.checkIsStreaming();
  // 200ms待つ
  await new Promise((resolve) => setTimeout(resolve, 200));
});
