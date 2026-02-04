import { serve } from "@hono/node-server";
import { type BrowserWindow, ipcMain } from "electron";
import { Hono } from "hono";

export const startServer = (window: BrowserWindow) => {
  const restapi = new Hono();
  restapi.get("/", async (c) => {
    return c.text("hello Node.js!");
  });

  restapi.post("/", async (c) => {
    const audio = await c.req.arrayBuffer();
    const channel = c.req.query("channel");
    const id = Date.now();
    window.webContents.send("audio", {
      id: id,
      channel: channel ? Number(channel) : 0,
      audio,
    });
    try {
      await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => resolve("timeout"), 30000);
        ipcMain.once(
          "finish",
          (_event, receivedId: number, receivedMessage: string) => {
            if (id === receivedId) {
              clearTimeout(timeout);
              if (receivedMessage === "ok") {
                resolve("finish");
              } else {
                reject(receivedMessage);
              }
            }
          },
        );
      });
      return c.text("ok");
    } catch (e) {
      return c.text(String(e), 500);
    }
  });

  serve({
    fetch: restapi.fetch,
    port: 8585,
  });
};
