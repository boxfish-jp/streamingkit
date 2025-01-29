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
				throw new Error("Failed to get voice peak data");
			}
			const data = await response.arrayBuffer();
			return new WavData(data);
		} catch (e) {
			throw new Error("Failed to get voice peak data");
		}
	}

	async play(wavData: WavData) {
		const filePath = await wavData.saveFile();
		await this._ffplay(filePath);
		await wavData.deleteFile();
	}

	private async _ffplay(filePath: string) {
		try {
			const stdout = execSync(
				`ffplay -autoexit ${filePath} -nodisp -volume 60`,
			);
			console.log(`stdout: ${stdout.toString()}`);
		} catch (e) {
			console.error(`Error: ${e}`);
		}
	}
}

export class WavData {
	private _data: ArrayBuffer;
	private _filePath: string;

	constructor(data: ArrayBuffer) {
		this._data = data;
		const unixTime = Date.now();
		this._filePath = join(process.cwd(), `${unixTime}.wav`).replaceAll(
			"\\",
			"/",
		);
	}

	async saveFile() {
		const buffer = Buffer.from(this._data);
		writeFileSync(this._filePath, buffer);
		return this._filePath;
	}

	async deleteFile() {
		unlinkSync(this._filePath);
	}
}
