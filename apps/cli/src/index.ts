import { SocketClient } from "socket_client";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ObsAudioClient } from "./obs_audio_client.js";
import { WatchAnimeAudio } from "./watch_anime_audio.js";
import { WatchOrgFiles } from "./watch_file.js";
import { WatchSpotify } from "./watch_spotify.js";

const DEFAULT_OBS_URL = "ws://127.0.0.1:4455";
const DEFAULT_OBS_UNMUTE_DELAY_SECONDS = 10;
const VOICE_NOTIFICATION_CHANNEL = 4;

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
          })
          .option("obs", {
            type: "boolean",
            default: true,
            describe: "OBSのデスクトップ音声をアニメ再生中にミュートする",
          })
          .option("obs-url", {
            type: "string",
            default: process.env.OBS_WEBSOCKET_URL ?? DEFAULT_OBS_URL,
            describe: "OBS WebSocketのURL",
          })
          .option("obs-input", {
            type: "string",
            default: process.env.OBS_AUDIO_INPUT,
            describe: "OBSの音声ソース名（未指定なら自動検出）",
          })
          .option("obs-unmute-delay", {
            type: "number",
            default: DEFAULT_OBS_UNMUTE_DELAY_SECONDS,
            describe:
              "アニメのイベントが止まってからミュートを解除するまでの秒数",
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
  const speak = (content: string) => {
    socketClient.emitMessage({
      type: "instSynthesize",
      content,
      channel: VOICE_NOTIFICATION_CHANNEL,
    });
  };
  const obsAudio =
    argv.obs === false
      ? null
      : new ObsAudioClient({
          url: (argv.obsUrl as string).trim(),
          inputName: (argv.obsInput as string | undefined)?.trim() || undefined,
          onMuteApplied: (muted) => {
            speak(muted ? "ミュートしました" : "ミュート解除しました");
          },
        });
  const animeAudio = obsAudio
    ? new WatchAnimeAudio({
        setMuted: (muted) => obsAudio.setMuted(muted),
        unmuteDelayMs: (argv.obsUnmuteDelay as number) * 1000,
      })
    : null;

  socketClient.on("message", (message) => {
    animeAudio?.handleMessage(message);
  });
  socketClient.on("connect", () => {
    console.log("ハブと接続しました");
    void obsAudio?.start();
  });
  socketClient.setServerUrl(url);

  const watcher = new WatchOrgFiles(dir);
  watcher.on("onChange", (oldFile, newFile) => {
    console.log("ファイルが変更されました");
    socketClient.emitMessage({
      type: "todoChanged",
      oldFile,
      newFile,
    });
  });

  const spotifyWatcher = new WatchSpotify();
  spotifyWatcher.on("onChange", (message) => {
    console.log(`再生中: ${message.title} / ${message.artist}`);
    socketClient.emitMessage(message);
  });

  const shutdown = async () => {
    await animeAudio?.dispose();
    await obsAudio?.dispose();
    socketClient.disconnect();
  };
  const exit = () => {
    void shutdown().finally(() => process.exit(0));
  };
  process.once("SIGINT", exit);
  process.once("SIGTERM", exit);
};
main();
