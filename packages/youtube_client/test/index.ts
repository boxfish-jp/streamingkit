import { YoutubeClient } from "../src/index.js";

const main = async () => {
  const apiKey = process.env.YOUTUBE_KEY || "";

  const youtubeClient = new YoutubeClient(apiKey, "UC4e7rsaJW-M7vr55lsDMjYQ");
  youtubeClient.on("onMessage", (message) => {
    console.log("Received message:", message);
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const liveChatId = await youtubeClient.getLiveChatId();

  console.log("Live Chat ID:", liveChatId);
  if (!liveChatId) {
    return;
  }
  youtubeClient.startGetChat(liveChatId);
};

main();
