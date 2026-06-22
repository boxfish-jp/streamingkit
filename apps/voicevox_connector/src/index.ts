import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { SynthesizedMessage } from "kit_models";
import { SocketClient } from "socket_client";

const VOICEVOX_URL = "http://0.0.0.0:50021";
const PORT = 50020;

const app = new Hono();
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

  const audioQueryUrl = new URL(`${VOICEVOX_URL}/audio_query`);
  audioQueryUrl.searchParams.set("text", text);
  audioQueryUrl.searchParams.set("speaker", String(character));

  const audioQueryRes = await fetch(audioQueryUrl, { method: "POST" });
  if (!audioQueryRes.ok) {
    return c.text(`VoiceVox audio_query failed: ${audioQueryRes.status}`, 502);
  }
  const audioQuery = await audioQueryRes.json();

  const synthesisUrl = new URL(`${VOICEVOX_URL}/synthesis`);
  synthesisUrl.searchParams.set("speaker", String(character));

  const synthesisRes = await fetch(synthesisUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audioQuery),
  });
  if (!synthesisRes.ok) {
    return c.text(`VoiceVox synthesis failed: ${synthesisRes.status}`, 502);
  }

  const arrayBuffer = await synthesisRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const message: SynthesizedMessage = {
    type: "synthesized",
    buffer,
    channel,
  };
  socket.emitMessage(message);

  return c.body(arrayBuffer, 200, {
    "Content-Type": "audio/wav",
  });
});

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
