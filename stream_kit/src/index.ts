import type { Server as HttpServer } from "node:http";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server as SocketServer } from "socket.io";
import { niconico } from "./get_comment";
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

const player = new Player();
niconico("lv346910090", async (comment) => {
	player.addQueue(comment);
});

setInterval(() => {
	ioServer.emit("play", "にゃんぱすー");
}, 10000);
