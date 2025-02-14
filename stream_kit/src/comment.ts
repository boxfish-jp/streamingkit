import { getEducationData } from "./lib/education";

export class Comment {
	content = "";
	constructor(content: string) {
		this.content = content;
	}

	fillter() {
		this.content = this.content.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
			String.fromCharCode(char.charCodeAt(0) - 0xfee0),
		);
		this.content = this.content.replace(/[A-Za-z]/g, (char) =>
			char.toLowerCase(),
		);
		if (this.content.search(/https?:\/\//) !== -1) {
			this.content = this.content.replace(
				/https?:\/\/[\w!?/\+\-_~=;\.,*&@#$%\(\)\'\[\]]+(\?[a-zA-Z0-9%=\-&_]+)?/g,
				"URL省略",
			);
		}
		const eduData = getEducationData();
		for (const key in eduData) {
			if (this.content.indexOf(key) !== -1) {
				this.content = this.content.replace(new RegExp(key, "g"), eduData[key]);
			}
		}
	}
}
