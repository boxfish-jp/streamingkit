import { Bus, type Message } from "kit_models";
import { SocketClient } from "socket_client";
import { applyEducation, normalizeLowerCase } from "./clean.js";
import { getCommands } from "./command/commands.js";
import {
  addEducationConfig,
  getEducationConfigs,
  removeEducationConfig,
} from "./education.js";
import { SpotifyClient } from "./spotify.js";
import { Streaming } from "./streaming.js";
import { SynthesizeRunner } from "./synthesize.js";

const bus_evnet = new Bus();
const cruseID = "70969122";
const niconicofuguoID = "98746932";
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID || "";
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const spotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN || "";
const youtubeChannelId = "UCqISdfvMMXfhgAJf-03pwXA";
const youtubeApiKey = process.env.YOUTUBE_KEY || "";

const main = async () => {
  const streaming = new Streaming(
    niconicofuguoID,
    youtubeChannelId,
    youtubeApiKey,
  );
  const onMessage = (message: Message) => {
    bus_evnet.emit(message);
  };
  streaming.on("onMessage", onMessage);
  streaming.startPooling();
  const commands = await getCommands();
  const socketClient = new SocketClient();
  socketClient.setServerUrl("http://hub:8888");
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
  const spotifyClient = new SpotifyClient(
    spotifyClientId,
    spotifyClientSecret,
    spotifyRefreshToken,
  );
  spotifyClient.start();
  spotifyClient.on("onMessage", onMessage);
  setInterval(() => {
    bus_evnet.emit({ type: "ping", who: "orchestrator" });
  }, 30000);

  const onEvent = (message: Message) => {
    switch (message.type) {
      case "comment":
        console.log(message.content);
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
                  status: "endNicoNicoStreaming",
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
        const educationConfigs = getEducationConfigs(onMessage);
        const cleanText = applyEducation(message.content, educationConfigs);
        makeAudioRunner.addQueue(cleanText, message.channel);
        break;
      }
      case "addEducation": {
        const config = { key: message.key, value: message.value };
        addEducationConfig(config, onMessage);
        break;
      }
      case "removeEducation": {
        removeEducationConfig(message.key, onMessage);
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
