import type { AnimeInfoMessage } from "kit_models";
import { SocketClient } from "socket_client";

const STORAGE_KEY_HUB_URL = "anime_hub_url";
const socket = SocketClient.instance();
socket.on("connect", () => {
  console.log("anime_extension: connected to hub");
});

socket.on("disconnect", () => {
  console.log("anime_extension: disconnected from hub");
});

socket.on("connect_error", (status, message) => {
  console.log(`anime_extension: ${status} message:${message}`);
});

const syncState = async () => {
  const hubResult = await chrome.storage.local.get(STORAGE_KEY_HUB_URL);
  const hubUrl = (hubResult[STORAGE_KEY_HUB_URL] as string) ?? "";
  console.log(`anime_extension: hub=${hubUrl}`);
  if (hubUrl) {
    socket.setServerUrl(hubUrl);
  }
  socket.connect();
};

const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "getConnectionStatus") {
      sendResponse({ connected: SocketClient.instance().isConnected });
      return true;
    }

    if (message.type === "animeInfo") {
      SocketClient.instance().emitMessage(message as AnimeInfoMessage);
      return true;
    }
  });
};

export default defineBackground(() => {
  console.log("anime_extension: background loaded");

  setupMessageListener();

  chrome.storage.onChanged.addListener(async (_, area) => {
    if (area !== "local") return;
    console.log("anime_extension: changed local setting");
    await syncState();
  });

  syncState();
});
