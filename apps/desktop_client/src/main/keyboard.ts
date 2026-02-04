import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { globalShortcut } from "electron/main";
import * as z from "zod";

const ShortCutConfigs = z.array(
	z.object({
		key: z.string(),
		url: z.string(),
	}),
);

export const addKeyboardEventListenner = () => {
	try {
		const data = readFileSync(
			path.join(homedir(), ".config", "audio_player", "setting.json"),
		);
		try {
			const shortCutConfigs = ShortCutConfigs.parse(
				JSON.parse(data.toString()),
			);

			/*
			const shortcuts: { [key: string]: string } = {
				F13: "http://localhost:2525?inst=talk",
				F14: "http://localhost:2525/interrupt",
				F15: "http://localhost:2525?inst=progress",
				F16: "http://localhost:2525?inst=cli",
			};
      */

			for (const config of shortCutConfigs) {
				const ret = globalShortcut.register(config.key, async () => {
					const receivedMessage = await sendPostRequest(config.url);
					console.log(`[${config.key}] ${receivedMessage}`);
				});

				if (!ret) {
					console.error(`${config.key} shortcutKey failed`);
				} else {
					console.log(`${config.key} shortcutKey success`);
				}
			}
		} catch (parseError) {
			console.log(
				"Configuration file is malformed. Keylogger will not start." +
					parseError,
			);
		}
	} catch (loadFileErr) {
		console.log("Configuration file not found. Keylogger will not start.");
	}
};

async function sendPostRequest(url: string): Promise<string> {
	try {
		const response: Response = await fetch(url, {
			method: "POST",
			headers: {},
		});

		if (response.ok) {
			return `${url} post request succeeded`;
		} else {
			try {
				const errorBody: string = await response.text();
				return `${url} post request failed: ${response.status} ${response.statusText} - ${errorBody}`;
			} catch (bodyError: unknown) {
				const message =
					bodyError instanceof Error ? bodyError.message : String(bodyError);
				return `${url} post request failed: ${response.status} ${response.statusText} - (failed to parse error body: ${message})`;
			}
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return `Fetch error for ${url}: ${message}`;
	}
}
