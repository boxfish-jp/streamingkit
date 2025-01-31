import { exec } from "node:child_process";
import type { Comment } from "../comment";

export const playSpotifyFromURL = async (comment: Comment) => {
	const urlobj = new URL(comment.content);
	const path = urlobj.pathname.split("/");
	const lint = lintPath(path);
	if (lint !== true) {
		comment.content = lint;
		return comment;
	}
	const trackIndex = path.indexOf("track") + 1;
	const trackUri = path[trackIndex];

	if (trackIndex === 0 || trackIndex > path.length) {
		comment.content = "urlが正しくないよ";
		return comment;
	}
	let result = "";
	try {
		result = await new Promise((resolve, reject) => {
			exec(
				`spt play -q -u spotify:track:${trackUri} -t`,
				(err: unknown, stdout: unknown, stderr: unknown) => {
					if (err || (!stdout && !stderr)) {
						resolve("error");
					}
					resolve("キューに追加しました");
				},
			);
		});
	} catch (e) {
		result = "error";
	}
	if (result !== "error") {
		comment.content = "キューに追加しました";
		return comment;
	}
	comment.content = "エラーが発生しました";
	return comment;
};

const lintPath = (path: string[]) => {
	for (const p of path) {
		if (p === "playlist") {
			return "playlistは未対応です";
		}
		if (p === "track") {
			return true;
		}
	}
	return "urlが正しくないよ";
};
