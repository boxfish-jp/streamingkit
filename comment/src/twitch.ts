import tmi from "tmi.js";

const twitch = async (channelId: string) => {
  const client = new tmi.Client({
    channels: [channelId],
  });

  client.connect();

  client.on("message", (channel, tags, message, self) => {
    if (self) return;

    console.log(`user:${tags["display-name"]} content:${message}`);
  });
};

export default twitch;
