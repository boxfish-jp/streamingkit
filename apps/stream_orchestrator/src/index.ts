import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { event_bus } from "./event_bus.js";

/*
const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3444,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
*/
