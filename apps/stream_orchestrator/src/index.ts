import { Bus, type Message } from "kit_models";
import { CheckStreamInfo } from "./check_stream_info.js";
import { clean } from "./clean.js";
import { getCommands } from "./command/commands.js";
import { getEducationConfigs } from "./education.js";
import { ListenComment } from "./listen_comment.js";
import { OrchestratorServer } from "./server.js";
import { SynthesizeRunner } from "./synthesize.js";

let isStreaming = false;
const bus_evnet = new Bus();
const cruseID = "70969122";
const fuguoID = "98746932";

const main = async () => {
  const checkStreamInfo = new CheckStreamInfo(fuguoID);
  const onMessage = (message: Message) => {
    bus_evnet.emit(message);
  };
  checkStreamInfo.on("streamInfo", onMessage);
  checkStreamInfo.on("error", onMessage);
  checkStreamInfo.startPooling();
  // TODO: コマンド追加の実装
  const commands = await getCommands(onMessage);
  const orchestratorServer = new OrchestratorServer("0.0.0.0", 8888);
  orchestratorServer.on("message", onMessage);
  const listenComment = new ListenComment();
  listenComment.on("comment", onMessage);
  listenComment.on("error", onMessage);
  const makeAudioRunner = new SynthesizeRunner();
  makeAudioRunner.on("synthesized", onMessage);
  makeAudioRunner.on("error", onMessage);

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
          content: message.content,
          tag: "comment",
        });
        break;
      case "streaming_info":
        if (message.isStreaming) {
          if (message.streamId && !isStreaming) {
            // TODO: 配信の開始を検知したことをユーザーに通知する処理の実装
            listenComment.start(`lv${message.streamId}`);
            console.log("配信開始を検知しました。", message.streamId);
          }
          isStreaming = true;
        } else {
          if (isStreaming) {
            // TODO: 配信の終了を検知したことをユーザーに通知する処理の実装
            listenComment.stop();
          }
          isStreaming = false;
        }
        break;
      case "synthesized":
        break;
      case "instSynthesize": {
        const educationConfigs = getEducationConfigs(onMessage);
        const cleanText = clean(message.content, educationConfigs);
        makeAudioRunner.addQueue(cleanText, message.tag);
        break;
      }
    }
  };

  bus_evnet.on(onEvent);
};

main();
