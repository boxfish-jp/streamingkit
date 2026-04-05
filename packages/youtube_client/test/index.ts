import { YoutubeClient } from "../src/index.js";

const main = async () => {
  const youtubeClientId = process.env.YOUTUBE_CLIENT_ID || "";
  const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET || "";
  const youtubeRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN || "";

  const youtubeClient = new YoutubeClient(
    youtubeClientId,
    youtubeClientSecret,
    youtubeRefreshToken,
  );
  youtubeClient.start();
  youtubeClient.on("onMessage", (message) => {
    console.log("Received message:", message);
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const liveChatId = await youtubeClient.getLiveChatId();

  if (!liveChatId) {
    return;
  }
  youtubeClient.startGetChat(liveChatId);
};

main();
