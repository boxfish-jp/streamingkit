import { spawn } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post("/", async (c) => {
	const body = await c.req.json();
	console.log(body);
	const text = body.text;
	if (typeof text !== "string") {
		return c.text("text is required", 400);
	}
	const fileName = `${Date.now()}.wav`;
	try {
		const result = spawn(
			"./Voicepeak/voicepeak",
			["-s", text, "-o", fileName],
			{
				stdio: ["pipe", "pipe", "inherit"],
			},
		);
		const timeout = setTimeout(() => {
			result.kill();
			throw new Error("Timeout");
		}, 30000);
		for await (const s of result.stdout) {
			console.log(`${s}`);
		}
		const status = await new Promise((resolve, reject) => {
			result.on("close", resolve);
		});
		console.log(status);
		if (status !== 0) {
			return c.text("Error", 500);
		}
		clearTimeout(timeout);
		const wavdata = readFileSync(fileName);
		return c.body(wavdata, 200, { "Content-Type": "audio/wav" });
	} catch (e) {
		return c.text("Error", 500);
	} finally {
		unlinkSync(fileName);
	}
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	hostname: "boxfish-linux.taildb6ca.ts.net",
	port,
});
