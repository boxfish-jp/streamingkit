import { SocketClient } from "socket_client";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  AnimePlaybackMute,
  DEFAULT_UNMUTE_DELAY_MS,
} from "./anime_playback_mute.js";
import { ObsAudioInputs } from "./obs_audio_inputs.js";
import { ObsConnection } from "./obs_connection.js";
import { ObsDesktopAudioMute } from "./obs_desktop_audio_mute.js";
import { VoiceNotifier } from "./voice_notification.js";
import { WatchMprisPlayer } from "./watch_mpris_player.js";
import { WatchOrgFiles } from "./watch_org_files.js";

const DEFAULT_OBS_URL = "ws://127.0.0.1:4455";
const DEFAULT_OBS_UNMUTE_DELAY_SECONDS = DEFAULT_UNMUTE_DELAY_MS / 1_000;

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
            describe: "OBS連携を有効にする",
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
  const voice = new VoiceNotifier((message) =>
    socketClient.emitMessage(message),
  );
  const dir = (argv.dir as string).trim();
  const url = (argv.url as string).trim();
  const obsEnabled = argv.obs !== false;

  const obsConnection = obsEnabled
    ? new ObsConnection({
        url: (argv.obsUrl as string).trim(),
      })
    : null;
  const obsAudioInputs = obsConnection
    ? new ObsAudioInputs(obsConnection, {
        desktopInputName:
          (argv.obsInput as string | undefined)?.trim() || undefined,
        desktopInputHint: "--obs-inputで音声ソース名を指定してください",
      })
    : null;
  const obsDesktopAudioMute =
    obsConnection && obsAudioInputs
      ? new ObsDesktopAudioMute(obsConnection, obsAudioInputs, {
          onMuteApplied: (muted) => {
            voice.speak(muted ? "ミュートしました" : "ミュート解除しました");
          },
        })
      : null;
  const animePlaybackMute = obsDesktopAudioMute
    ? new AnimePlaybackMute({
        setDesktopMuted: (muted) => obsDesktopAudioMute.setMuted(muted),
        unmuteDelayMs: (argv.obsUnmuteDelay as number) * 1_000,
      })
    : null;

  void obsConnection?.start();

  socketClient.on("message", (message) => {
    animePlaybackMute?.handleMessage(message);
  });
  socketClient.on("connect", () => {
    console.log("ハブと接続しました");
  });
  socketClient.setServerUrl(url);

  const orgWatcher = new WatchOrgFiles(dir);
  orgWatcher.on("onChange", (oldFile, newFile) => {
    console.log("ファイルが変更されました");
    socketClient.emitMessage({
      type: "todoChanged",
      oldFile,
      newFile,
    });
  });
  const spotifyWatcher = new WatchMprisPlayer();
  spotifyWatcher.on("onChange", (message) => {
    console.log(`再生中: ${message.title} / ${message.artist}`);
    socketClient.emitMessage(message);
  });

  await orgWatcher.ready;

  const shutdown = async () => {
    await animePlaybackMute?.dispose();
    obsDesktopAudioMute?.dispose();
    await obsConnection?.dispose();
    await orgWatcher.dispose();
    spotifyWatcher.dispose();
    socketClient.disconnect();
  };
  const exit = () => {
    void shutdown().finally(() => process.exit(0));
  };
  process.once("SIGINT", exit);
  process.once("SIGTERM", exit);
};
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
