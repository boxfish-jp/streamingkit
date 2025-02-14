import type { Server as HttpServer } from "node:http";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server as SocketServer } from "socket.io";
import { CommentServer, bot } from "./bot";
import { getCommands } from "./command";
import { niconico } from "./get_comment";
import { getStreamingInfo } from "./get_streaming_info";
import { Player } from "./player";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export const port = 3000;
export const hostname = "localhost";
console.log(`Server is running on http://localhost:${port}`);

const server = serve({ fetch: app.fetch, port: port, hostname: hostname });

export const ioServer = new SocketServer(server as HttpServer, {
	path: "/ws",
	serveClient: false,
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

ioServer.on("error", (err) => {
	console.log(err);
});

const main = async () => {
	const liveInfo = await getStreamingInfo();
	if (!liveInfo || !liveInfo.nicoWsurl || !liveInfo.vposBaseTime) {
		console.error("Failed to get live info");
		return;
	}
	const commentServer = new CommentServer(
		liveInfo.nicoWsurl,
		liveInfo.vposBaseTime,
	);
	const player = new Player();
	console.log("start");
	niconico(liveInfo.liveId, async (comment) => {
		comment.fillter();
		const commands = await getCommands();
		for (const command of commands) {
			if (comment.content.startsWith(command.keyword)) {
				player.addQueue(await command.process(comment));
				return;
			}
		}
		if (comment.content.startsWith("。")) {
			bot(comment, commentServer);
			return;
		}
		player.addQueue(comment.getEducatiedComment());
	});
};

main();
