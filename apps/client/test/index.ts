import { readFileSync } from "node:fs";
import { join } from "node:path";

const main = async () => {
	const audioData = readFileSync(join(__dirname, "test.wav"));
	try {
		const url = "http://localhost:8686?channel=0";
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: audioData,
		});

		if (!response.ok) {
			console.log(`Failed to post audio data: ${response.statusText}`);
		}
	} catch (e) {
		console.log(`Failed to play audio: ${String(e)}`);
	}
};

main();
