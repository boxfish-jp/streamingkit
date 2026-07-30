import { SqliteEducationStore } from "education_store";
import { Bus, type Message, type SendCommentMessage } from "kit_models";
import { SocketClient } from "socket_client";
import { SqliteTokenStore } from "token_store";
import { applyEducation, normalizeLowerCase } from "./clean.js";
import { getCommands } from "./command/commands.js";
import {
  addEducationConfig,
  getEducationConfigs,
  removeEducationConfig,
} from "./education.js";
import { NightbotClient } from "./nightbot.js";
import { SpotifyClient } from "./spotify.js";
import { Streaming } from "./streaming.js";
import { SynthesizeRunner } from "./synthesize.js";
import { TimeSignal } from "./time_signal.js";
import { sendCommentBothSites } from "./utils.js";

const bus_evnet = new Bus();
const niconicofuguoID = "98746932";
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID || "";
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const nightbotClientId = process.env.NIGHTBOT_CLIENT_ID || "";
const nightbotClientSecret = process.env.NIGHTBOT_CLIENT_SECRET || "";
const tokenDbPath = process.env.TOKEN_DB_PATH || "./data/tokens.db";
const educationDbPath = process.env.EDUCATION_DB_PATH || "./data/education.db";
const headlessBrowserUrl =
  process.env.NICONICO_HEADLESS_BROWSER_URL || "http://192.168.68.15:3000";
const youtubeChannelHandler = "@boxfish_jp";

const main = async () => {
  const onMessage = (message: Message) => {
    bus_evnet.emit(message);
  };

  const tokenStore = new SqliteTokenStore(tokenDbPath);
  const educationStore = new SqliteEducationStore(educationDbPath);
  const spotifyClient = new SpotifyClient(
    spotifyClientId,
    spotifyClientSecret,
    tokenStore,
  );
  spotifyClient.start();
  spotifyClient.on("onMessage", onMessage);
  const nightbotClient = new NightbotClient(
    nightbotClientId,
    nightbotClientSecret,
    tokenStore,
  );
  nightbotClient.on("onMessage", onMessage);
  nightbotClient.start();
  const streaming = new Streaming(
    niconicofuguoID,
    youtubeChannelHandler,
    nightbotClient,
    headlessBrowserUrl,
  );
  streaming.on("onMessage", onMessage);
  streaming.startPooling();
  new TimeSignal(() => streaming.isStreaming, onMessage);
  const commands = await getCommands();
  const socketClient = new SocketClient();
  socketClient.setServerUrl(process.argv[2] ?? "http://hub:8888");
  //socketClient.connect();
  socketClient.on("connect", () => {
    console.log("ハブと接続しました");
  });
  setInterval(
    () => {
      onMessage({ type: "todoShow", instruction: "show" });
    },
    5 * 60 * 1000,
  );
  const makeAudioRunner = new SynthesizeRunner();
  makeAudioRunner.on("synthesized", onMessage);
  makeAudioRunner.on("error", onMessage);
  setInterval(() => {
    bus_evnet.emit({ type: "ping", who: "orchestrator" });
  }, 30000);

  const onEvent = (message: Message) => {
    switch (message.type) {
      case "comment":
        console.log(message.content);
        if (message.label === "viewer") {
          switch (message.site) {
            case "niconico":
              bus_evnet.emit({
                type: "sendComment",
                site: "youtube",
                content: `ニコニココメ「${message.content}」`,
              } as SendCommentMessage);
              break;
            case "youtube":
              bus_evnet.emit({
                type: "sendComment",
                site: "niconico",
                content: `YouTubeコメ「${message.content}」`,
              } as SendCommentMessage);
          }
        }
        for (const command of commands) {
          if (command.isTarget(message)) {
            const synthesizeMessage = command.synthesize(message);
            if (synthesizeMessage) {
              onMessage(synthesizeMessage);
            }
            const commandMessages = command.action(message);
            commandMessages.forEach(onMessage);
            return;
          }
        }
        bus_evnet.emit({
          type: "instSynthesize",
          content: normalizeLowerCase(message.content),
          channel: 0,
        });
        break;
      case "streaming_info":
        switch (message.site) {
          case "niconico":
            if (message.isStreaming) {
              if (message.streamId && !message.wasStreaming) {
                bus_evnet.emit({
                  type: "notify",
                  status: "startNicoNicoStreaming",
                });
                streaming.startWatchNicoNicoComment(message.streamId);
                console.log(
                  "ニコニコの配信開始を検知しました。",
                  message.streamId,
                );
              }
              streaming.setWasNicoNicoStreaming(true);
            } else {
              if (message.wasStreaming) {
                bus_evnet.emit({
                  type: "notify",
                  status: "endNicoNicoStreaming",
                });
                streaming.stopWatchNicoNicoComment();
              }
              streaming.setWasNicoNicoStreaming(false);
            }
            break;
          case "youtube":
            if (message.isStreaming) {
              if (message.streamId && !message.wasStreaming) {
                bus_evnet.emit({
                  type: "notify",
                  status: "startYoutubeStreaming",
                });
                streaming.startWatchYoutubeComment(message.streamId);
                console.log(
                  "youtubeの配信開始を検知しました。",
                  message.streamId,
                );
              }
              streaming.setWasYoutubeStreaming(true);
            } else {
              if (message.wasStreaming) {
                bus_evnet.emit({
                  type: "notify",
                  status: "endYoutubeStreaming",
                });
                streaming.stopWatchYoutubeComment();
              }
              streaming.setWasYoutubeStreaming(false);
            }
        }
        break;
      case "synthesized":
        break;
      case "instSynthesize": {
        const educationConfigs = getEducationConfigs(educationStore);
        const cleanText = applyEducation(message.content, educationConfigs);
        makeAudioRunner.addQueue(cleanText, message.channel);
        break;
      }
      case "addEducation": {
        const config = { key: message.key, value: message.value };
        addEducationConfig(educationStore, config, onMessage);
        break;
      }
      case "removeEducation": {
        removeEducationConfig(educationStore, message.key);
        break;
      }
      case "spotify":
        {
          if (message.content.instruction === "addQueue") {
            spotifyClient.addQueue(message.content.uri);
          }
        }
        break;
      case "viewerCountUpdate": {
        onMessage({ type: "todoShow", instruction: "show" });
        break;
      }
      case "sendComment": {
        streaming.sendComment(message.site, message.content);
        break;
      }
      case "notify":
        {
          if (message.status === "successfulAddSpotifyQueue") {
            sendCommentBothSites("bot: キューに追加しました").forEach(
              (message) => {
                bus_evnet.emit(message);
              },
            );
          }
          if (message.status === "serverNeedAuthorization" && message.message) {
            makeAudioRunner.addQueue(message.message, 0);
          }
        }
        break;
      case "error":
        {
          console.log("Error:", message.message);
        }
        break;
      case "ping": {
        if (message.who === "client") {
          bus_evnet.emit({
            type: "connection",
            status: "ok",
            where: ["client", "orchestrator"],
          });
        }
      }
    }
  };

  socketClient.on("message", onEvent);
  bus_evnet.on((message) => {
    socketClient.emitMessage(message);
    onEvent(message);
  });
};

main();

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
