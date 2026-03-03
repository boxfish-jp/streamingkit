import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { watch } from "chokidar";

const watcher = watch(`${path.join(os.homedir(), "dev")}`, {
  ignored: (path, stats) =>
    !!stats && stats?.isFile() && !path.endsWith(".org"),
});

watcher.on("ready", () => {
  console.log("watcher is ready!");

  watcher.on("change", (path) => {
    console.log(`${path} change detected`);
    read(path);
  });

  watcher.on("add", (path) => {
    console.log(`${path} change detected`);
    read(path);
  });

  watcher.on("unlink", (path) => {
    console.log(`${path} change deleted`);
  });
});

const read = async (path: string) => {
  console.log(`Reading file: ${path}`);
  const data = await readFile(path);
  console.log(data.toString());
};
