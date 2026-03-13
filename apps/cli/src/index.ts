import { SocketClient } from "packages/socket_client/dist/index.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { WatchOrgFiles } from "./watch_file.js";

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .command(
      "run [dir] [url]",
      "process directory",
      (yargs) => {
        return yargs
          .positional("dir", {
            describe: "directory path to process",
            type: "string",
            demandOption: true,
          })
          .positional("url", {
            describe: "server url",
            type: "string",
            demandOption: true,
          });
      },
      (argv) => {
        console.log(`Watching directory: ${argv.dir}`);
        console.log(`Server URL: ${argv.url}`);
      },
    )
    .demandCommand(1, "You must specify a command")
    .help()
    .strict()
    .parse();

  const socketClient = new SocketClient();
  const dir = (argv.dir as string).trim();
  const url = (argv.url as string).trim();
  const watcher = new WatchOrgFiles(dir);
  socketClient.setServerUrl(url);
  socketClient.on("connect", () => {
    console.log("ハブと接続しました");
  });

  watcher.on("onChange", (oldFile, newFile) => {
    console.log("ファイルが変更されました");
    socketClient.emitMessage({
      type: "todoChanged",
      oldFile,
      newFile,
    });
  });
};
main();
