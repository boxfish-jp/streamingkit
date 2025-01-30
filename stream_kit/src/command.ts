import { readdir } from "node:fs";
import { join } from "node:path";
import { ioServer } from ".";
import type { Comment } from "./comment";

export interface Command {
	keyword: string;
	process: (comment: Comment) => Promise<Comment>;
}

export const getCommands = async () => {
	const normalCommands = await getNormalCommands();
	return [...normalCommands];
};
export const getSpecialCommands = (): Command[] => {
	const exprosion: Command = {
		keyword: "エクスプロージョン",
		process: async (comment: Comment): Promise<Comment> => {
			const random = Math.floor(Math.random() * 100);
			if (random < 25) {
				ioServer.emit("play", "エクスプロージョン1");
			} else if (random >= 25 && random < 50) {
				ioServer.emit("play", "エクスプロージョン2");
			} else if (random >= 50 && random < 75) {
				ioServer.emit("play", "エクスプロージョン3");
			} else {
				ioServer.emit("play", "エクスプロージョン4");
			}
			comment.content = "";
			return comment;
		},
	};
	const hatena = {
		keyword: "？",
		process: async (comment: Comment): Promise<Comment> => {
			ioServer.emit("play", "？");
			comment.content = "";
			return comment;
		},
	};
	const patipati = {
		keyword: "8888",
		process: async (comment: Comment): Promise<Comment> => {
			ioServer.emit("play", "８８８８");
			comment.content = "";
			return comment;
		},
	};
	const omg = {
		keyword: "omg",
		process: async (comment: Comment): Promise<Comment> => {
			ioServer.emit("play", "OMG");
			comment.content = "";
			return comment;
		},
	};
	return [exprosion, hatena, patipati, omg];
};

export const getNormalCommands = async (): Promise<Command[]> => {
	const directoryPath = join(__dirname, "../../video");
	const normalKeywords = await new Promise<string[]>((resolve, reject) => {
		readdir(directoryPath, (err, files) => {
			if (err) {
				console.log("Unable to scan directory: ");
				reject(err);
			} else {
				const commands = files.map((file) => file.replace(".mp4", ""));
				resolve(commands);
			}
		});
	});
	const commands: Command[] = [];
	for (const keyword of normalKeywords) {
		commands.push({
			keyword,
			process: async (comment: Comment) => {
				ioServer.emit("play", keyword);
				comment.content =
					comment.content.length > keyword.length ? comment.content : "";
				return comment;
			},
		});
	}
	return commands;
};
