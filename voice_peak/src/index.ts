import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec, execSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/', async (c) => {
  const body = await c.req.json();
  console.log(body);
  const text = body.text;
  if (typeof text !== 'string') {
    return c.text('text is required', 400)
  }
  try {
    const result = spawn("./Voicepeak/voicepeak", ["-s", text], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    for await (const s of result.stdout) {
      console.log(`${s}`);
    }
    const status = await new Promise((resolve, reject) => {
      result.on("close", resolve);
    });
    console.log(status);
    const wavdata = readFileSync("./output.wav");
    return c.body(wavdata, 200, { 'Content-Type': 'audio/wav' })
  } catch (e) {
    return c.text('Error', 500)
  }
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  hostname: "boxfish-linux.taildb6ca.ts.net",
  port
})
