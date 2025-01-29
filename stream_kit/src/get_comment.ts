import type { Chat } from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node";
import { Comment } from "./comment";

export const niconico = async (
	liveId: string,
	onReceive: (comment: Comment) => Promise<void>,
) => {
	new NicoliveClient({ liveId: liveId })
		.on("chat", (chat: Chat) => {
			const newComment = new Comment(chat.content);
			onReceive(newComment);
		})
		.on("simpleNotification", (notification) => {
			const content = notification.message.value;
			if (!content) {
				return;
			}
			const newComment = new Comment(notification.message.value);
			onReceive(newComment);
		})
		.on("changeState", (state) => {
			const nusiCome = state.marque?.display?.operatorComment?.content;
			if (!nusiCome) {
				return;
			}
			const newComment = new Comment(nusiCome);
			onReceive(newComment);
		})
		.connect();
};
