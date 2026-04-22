import { YoutubeClient } from "../src/index.js";

const main = async () => {
  const apiKey = process.env.YOUTUBE_KEY || "";

  const valo = "@usadapekora";
  const youtubeClient = new YoutubeClient(apiKey, valo);
  youtubeClient.on("onMessage", (message) => {
    console.log("Received message:", message);
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const liveChatId = await youtubeClient.getLiveChatId();
  if (liveChatId) {
    console.log("ライブ配信中です。");
  } else {
    console.log("ライブ配信は行われていません。");
  }

  console.log("Live Chat ID:", liveChatId);
  /**
  if (!liveChatId) {
    return;
  }
  youtubeClient.startGetChat(liveChatId);
  **/
};

main();
