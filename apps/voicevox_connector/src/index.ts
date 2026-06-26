import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { SynthesizedMessage } from "kit_models";
import { SocketClient } from "socket_client";
import { ServerPool } from "./server_pool.js";

const VOICEVOX_URLS = (process.env.VOICEVOX_URLS || "http://0.0.0.0:50021")
  .split(",")
  .map((s) => s.trim());
const PING_INTERVAL = Number(process.env.VOICEVOX_PING_INTERVAL_MS) || 30000;

const pool = new ServerPool(VOICEVOX_URLS, PING_INTERVAL);

const app = new Hono();
const PORT = 50020;
serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: PORT,
  },
  (info) => {
    console.log(
      `voicevox_connector running on http://${info.address}:${info.port}`,
    );
  },
);

const socket = SocketClient.instance();
socket.connect();

app.post("/", async (c) => {
  const text = c.req.query("text");
  const channelStr = c.req.query("channel");
  const characterStr = c.req.query("character");

  if (!text || !channelStr || !characterStr) {
    return c.text("Missing required parameters: text, channel, character", 400);
  }

  const channel = Number(channelStr);
  const character = Number(characterStr);

  const aliveServers = pool.getAliveServers();
  if (aliveServers.length === 0) {
    return c.text("No alive VoiceVox servers available", 503);
  }

  for (const serverUrl of aliveServers) {
    try {
      const audioQueryUrl = new URL(`${serverUrl}/audio_query`);
      audioQueryUrl.searchParams.set("text", text);
      audioQueryUrl.searchParams.set("speaker", String(character));

      const audioQueryRes = await fetch(audioQueryUrl, { method: "POST" });
      if (!audioQueryRes.ok) {
        console.warn(
          `[VoiceVox] audio_query failed on ${serverUrl}: ${audioQueryRes.status}`,
        );
        pool.markDead(serverUrl);
        continue;
      }
      const audioQuery = await audioQueryRes.json();

      const synthesisUrl = new URL(`${serverUrl}/synthesis`);
      synthesisUrl.searchParams.set("speaker", String(character));

      const synthesisRes = await fetch(synthesisUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audioQuery),
      });

      if (!synthesisRes.ok) {
        console.warn(
          `[VoiceVox] synthesis failed on ${serverUrl}: ${synthesisRes.status}`,
        );
        pool.markDead(serverUrl);
        continue;
      }

      const arrayBuffer = await synthesisRes.arrayBuffer();

      socket.emitMessage({
        type: "synthesized",
        buffer: Buffer.from(arrayBuffer),
        channel,
      } as SynthesizedMessage);

      return c.body(arrayBuffer, 200, {
        "Content-Type": "audio/wav",
      });
    } catch (err) {
      console.error(`[VoiceVox] request error on ${serverUrl}:`, err);
      pool.markDead(serverUrl);
    }
  }

  return c.text("All VoiceVox servers failed", 502);
});
