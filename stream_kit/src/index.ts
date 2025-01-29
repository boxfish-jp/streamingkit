import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { niconico } from "./get_comment";
import { Player } from "./player";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

const player = new Player();
niconico("lv346903029", async (comment) => {
	player.addQueue(comment);
});

serve({
	fetch: app.fetch,
	port,
});
