import advertiseJson from "../../advertise.json";
import { type CommentServer, getSimpleBotTasksKeywords } from "./bot";

export const advertise = async (server: CommentServer) => {
	const contents = await getAdvertiseContents();
	const which = getRandomInt(2);
	if (which === 0) {
		server.send(`bot:${contents.howto[getRandomInt(contents.howto.length)]}`);
	} else {
		server.send(
			`bot:${contents.advertise[getRandomInt(contents.advertise.length)]}`,
		);
	}
};

const getAdvertiseContents = async () => {
	const data = advertiseJson;
	const howto = data.howto || [];

	const keywords = await getSimpleBotTasksKeywords();
	keywords.push("曲");
	howto.push(
		`。の後に特定のワードを付けるとbotが返答してくれるよ。特定のワード: ${keywords.join(",")}`,
	);

	return {
		howto,
		advertise: data.advertise || [],
	};
};

function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}
