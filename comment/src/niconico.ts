import { NicoliveClient } from "@kikurage/nicolive-api/node";
import fetcher from "../lib/fetcher";
import { getLiveId } from "../lib/getLiveId";
import { Chat } from "@kikurage/nicolive-api";

export const niconico = async (userId: string) => {
  const pageText = await fetcher(
    "https://live.nicovideo.jp/watch/user/" + userId
  );
  const nowliveId = await getLiveId(pageText);

  new NicoliveClient({ liveId: nowliveId })
    .on("chat", (chat: Chat) => {
      console.log(
        JSON.stringify({
          user_id: chat.name ? chat.name : chat.source.value,
          content: chat.content,
          no: -1,
        }) + ","
      );
    })
    .on("simpleNotification", (notification) => {
      console.log(
        JSON.stringify({
          user_id: "niconico",
          content: notification.message.value,
          no: -1,
        }) + ","
      );
    })
    .on("changeState", (state) => {
      const nusiCome = state.marque?.display?.operatorComment?.content;
      if (nusiCome) {
        console.log(
          JSON.stringify({
            user_id: "huguo",
            content: nusiCome,
            no: -1,
          }) + ","
        );
      }
    })
    .connect();
};
