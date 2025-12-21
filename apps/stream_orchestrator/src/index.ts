import { Bus, type Message } from "kit_models";
import { CheckStreamInfo } from "./check_stream_info.js";
import { applyEducation, normalizeLowerCase } from "./clean.js";
import { getCommands } from "./command/commands.js";
import {
  addEducationConfig,
  getEducationConfigs,
  removeEducationConfig,
} from "./education.js";
import { ListenComment } from "./listen_comment.js";
import { OrchestratorServer } from "./server.js";
import { SpotifyClient } from "./spotify.js";
import { SynthesizeRunner } from "./synthesize.js";

let isStreaming = false;
const bus_evnet = new Bus();
const cruseID = "70969122";
const fuguoID = "98746932";
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID || "";
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const spotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN || "";

const main = async () => {
  const checkStreamInfo = new CheckStreamInfo(fuguoID);
  const onMessage = (message: Message) => {
    bus_evnet.emit(message);
  };
  checkStreamInfo.on("streamInfo", onMessage);
  checkStreamInfo.on("error", onMessage);
  checkStreamInfo.startPooling();
  const commands = await getCommands();
  const orchestratorServer = new OrchestratorServer("0.0.0.0", 8888);
  orchestratorServer.on("message", onMessage);
  const listenComment = new ListenComment();
  listenComment.on("comment", onMessage);
  listenComment.on("error", onMessage);
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

  const onEvent = (message: Message) => {
    orchestratorServer.emitMessage(message);
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
          tag: "comment",
        });
        break;
      case "streaming_info":
        if (message.isStreaming) {
          if (message.streamId && !isStreaming) {
            bus_evnet.emit({
              type: "notify",
              status: "startStreaming",
            });
            listenComment.start(`lv${message.streamId}`);
            console.log("配信開始を検知しました。", message.streamId);
          }
          isStreaming = true;
        } else {
          if (isStreaming) {
            bus_evnet.emit({
              type: "notify",
              status: "endStreaming",
            });
            listenComment.stop();
          }
          isStreaming = false;
        }
        break;
      case "synthesized":
        break;
      case "instSynthesize": {
        const educationConfigs = getEducationConfigs(onMessage);
        const cleanText = applyEducation(message.content, educationConfigs);
        makeAudioRunner.addQueue(cleanText, message.tag);
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
      case "error": {
        console.log("Error:", message.message);
      }
    }
  };

  bus_evnet.on(onEvent);
};

main();
