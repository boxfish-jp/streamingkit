import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const voicePeakServerUrl = "http://boxfish-linux.taildb6ca.ts.net:3000";

export class AudioHandler {
	private _text: string;

	constructor(text: string) {
		this._text = text;
	}

	async getVoicePeakData() {
		try {
			const response = await fetch(voicePeakServerUrl, {
				method: "POST",
				body: JSON.stringify({
					text: this._text,
				}),
			});
			if (response.status !== 200 || response.body === null) {
				return undefined;
			}
			const data = await response.arrayBuffer();
			return new WavData(data);
		} catch (e) {
			return undefined;
		}
	}

	async play(wavData: WavData) {
		const filePath = await wavData.saveFile();
		await this._ffplay(filePath);
		await wavData.deleteFile();
	}

	async sendServer(wavData: WavData) {
		try {
			const url = "http://localhost:8686?channel=0";
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: wavData.data,
			});

			if (!response.ok) {
				console.log(`Failed to post audio data: ${response.statusText}`);
			}
		} catch (e) {
			console.log(`Failed to play audio: ${String(e)}`);
		}
	}

	private async _ffplay(filePath: string) {
		try {
			const stdout = execSync(`ffplay -autoexit ${filePath} -nodisp`);
			console.log(`stdout: ${stdout.toString()}`);
		} catch (e) {
			console.error(`Error: ${e}`);
		}
	}
}

export class WavData {
	public data: ArrayBuffer;
	private _filePath: string;

	constructor(data: ArrayBuffer) {
		this.data = data;
		const unixTime = Date.now();
		this._filePath = join(process.cwd(), `${unixTime}.wav`).replaceAll(
			"\\",
			"/",
		);
	}

	async saveFile() {
		const buffer = Buffer.from(this.data);
		writeFileSync(this._filePath, buffer);
		return this._filePath;
	}

	async deleteFile() {
		unlinkSync(this._filePath);
	}
}
