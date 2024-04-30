import { Hono } from "hono";
import { streamText } from "hono/streaming";
import type { FC } from "hono/jsx";
import Message from "./message";
import writeStream from "./writeStream";

const app = new Hono();

const message = new Message();

const Layout: FC = () => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>hono/jsx</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/page.tsx"></script>
      </body>
    </html>
  );
};

app.get("/page", (c) => {
  return c.html(<Layout />);
});

app.get("/message", (c) => {
  const mess = c.req.query("message");
  console.log(mess);
  if (mess) {
    message.setMessage(decodeURIComponent(mess));
    return c.text(`Message set to ${decodeURIComponent(mess)}`);
  }
  return c.text(`Message set to empty`);
});

app.get("/", (c) => {
  console.log("stream Start");
  return streamText(c, async (stream) => {
    while (true) {
      const mess = message.getMessage();
      if (mess?.startsWith("c:wait:")) {
        await writeStream(
          stream,
          mess.split(":")[2],
          parseInt(mess.split(":")[2]) * 50
        );
      } else if (mess) {
        await writeStream(stream, mess, (mess.length / 4.3) * 1000);
      } else {
        await writeStream(stream, "noMessageSet", 1000);
      }
    }
  });
});

export default app;
