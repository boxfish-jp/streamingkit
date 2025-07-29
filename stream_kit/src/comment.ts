import { getEducationData } from "./lib/education";

export class Comment {
	readonly who: "fuguo" | "viewer" | "bot";
	content = "";

	constructor(who: Comment["who"], content: string) {
		this.who = who;
		this.content = content;
	}

	get isRequestBot(): boolean {
		return this.content.startsWith("。");
	}

	get isRequestAdvertise(): boolean {
		return this.content.startsWith("30分延長しました");
	}

	getEducatiedComment() {
		let text = this.content;
		if (this.content.search(/https?:\/\//) !== -1) {
			text = text.replace(
				/https?:\/\/[\w!?/\+\-_~=;\.,*&@#$%\(\)\'\[\]]+(\?[a-zA-Z0-9%=\-&_]+)?/g,
				"URL省略",
			);
		}
		const eduData = getEducationData();
		for (const key in eduData) {
			if (this.content.indexOf(key) !== -1) {
				text = text.replace(new RegExp(key, "g"), eduData[key]);
			}
		}
		console.log("text", text);
		return new Comment(this.who, text);
	}

	fillter() {
		if (this.content.search(/https?:\/\//) !== -1) {
			return;
		}
		if (this.content.endsWith("好きなものリストに登録しました")) {
			this.content = "";
		}
		this.content = this.content.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
			String.fromCharCode(char.charCodeAt(0) - 0xfee0),
		);
		this.content = this.content.replace(/[A-Za-z]/g, (char) =>
			char.toLowerCase(),
		);
	}
}
