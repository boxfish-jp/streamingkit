import { readFile } from "node:fs/promises";
import { load } from "js-toml";
import type { Comment } from "./comment";
import { getSongName } from "./lib/spotify";

export const bot = async (comment: Comment, server: CommentServer) => {
	const content = comment.content.replace("。", "").toLowerCase();
	if (content.startsWith("曲")) {
		const name = await getSongName();
		server.send(name);
	}
	if (content.startsWith("h") || content.startsWith("ｈ")) {
		const keywords = await getSimpleBotTasksKeywords();
		keywords.push("曲");
		server.send(keywords.join(","));
	}
	const simpleTasks = await simpleBotTasks();
	for (const task of simpleTasks) {
		if (content.startsWith(task.keyword)) {
			server.send(task.task);
		}
	}

	comment.content = "";
	return comment;
};

const simpleBotTasks = async () => {
	const toml = await readFile("../simpleBotConfig.toml", "utf-8");
	const parsedData = load(toml);
	const tasks: { keyword: string; task: string }[] = [];
	for (const [name, value] of Object.entries(parsedData)) {
		for (const keyword of value.keywords) {
			tasks.push({
				keyword: keyword.toLowerCase(),
				task: typeof value.task === "string" ? (value.task as string) : "",
			});
		}
	}
	return tasks;
};

const getSimpleBotTasksKeywords = async () => {
	const toml = await readFile("../simpleBotConfig.toml", "utf-8");
	const parsedData = load(toml);
	return Object.keys(parsedData);
};

export class CommentServer {
	private _wssUrl: string;
	private _vposBaseTime: number;
	private _ws: WebSocket;

	constructor(wssUrl: string, vposBaseTime: number) {
		this._wssUrl = wssUrl;
		this._vposBaseTime = vposBaseTime;
		this._ws = new WebSocket(this._wssUrl);
		this._init();
	}

	send(content: string) {
		const vpos = Math.round(
			(new Date().getTime() - this._vposBaseTime * 1000) / 10,
		);
		this._ws.send(
			JSON.stringify({
				type: "postComment",
				data: {
					text: content,
					vpos: vpos,
				},
			}),
		);
	}

	private _init() {
		this._ws = new WebSocket(this._wssUrl);
		this._ws.onclose = () => {
			this._init();
		};
	}
}
