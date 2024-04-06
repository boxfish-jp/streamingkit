import tmi from "tmi.js";

const twitch = async (channelId: string) => {
  const client = new tmi.Client({
    channels: [channelId],
  });

  client.connect();

  client.on("message", (channel, tags, message, self) => {
    if (self) return;

    console.log(
      JSON.stringify({
        user_id: tags["display-name"],
        content: message,
        no: -1,
      }) + ","
    );
  });
};

export default twitch;
