import os from "node:os";
import path from "node:path";
import { watch } from "chokidar";

const target = path.join(os.homedir(), "dev/test/chokidar/");
const watcher = watch(target);

watcher.on("ready", () => {
  console.log("watcher is ready");

  watcher.on("change", (path) => {
    console.log(`${path} change detected`);
  });

  watcher.on("add", (path) => {
    console.log(`${path} change detected`);
  });

  watcher.on("unlink", (path) => {
    console.log(`${path} change deleted`);
  });
});

console.log("watching...");
