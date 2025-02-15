import { getEducationData } from "./lib/education";

export class Comment {
	content = "";
	constructor(content: string) {
		this.content = content;
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
		return new Comment(text);
	}

	fillter() {
		if (this.content.search(/https?:\/\//) !== -1) {
			return;
		}
		this.content = this.content.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
			String.fromCharCode(char.charCodeAt(0) - 0xfee0),
		);
		this.content = this.content.replace(/[A-Za-z]/g, (char) =>
			char.toLowerCase(),
		);
	}
}
