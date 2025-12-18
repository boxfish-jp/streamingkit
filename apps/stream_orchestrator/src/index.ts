import { Bus, type Command, type Message } from "kit_models";
import { CheckStreamInfo } from "./check_stream_info.js";
import { clean } from "./clean.js";
import { getEducationConfigs } from "./education.js";
import { ListenComment } from "./listen_comment.js";
import { OrchestratorServer } from "./server.js";
import { SynthesizeRunner } from "./synthesize.js";

let isStreaming = false;
const bus_evnet = new Bus();
const cruseID = "70969122";
const fuguoID = "98746932";
const checkStreamInfo = new CheckStreamInfo(fuguoID);
checkStreamInfo.on("streamInfo", (message) => {
  bus_evnet.emit(message);
});
checkStreamInfo.on("error", (message) => {
  bus_evnet.emit(message);
});
checkStreamInfo.startPooling();
// TODO: コマンド追加の実装
const commands: Command[] = [];
const orchestratorServer = new OrchestratorServer("0.0.0.0", 8888);
orchestratorServer.on("message", (message) => {
  bus_evnet.emit(message);
});
const listenComment = new ListenComment();
listenComment.on("comment", (message) => {
  bus_evnet.emit(message);
});
listenComment.on("error", (message) => {
  bus_evnet.emit(message);
});
const makeAudioRunner = new SynthesizeRunner();
makeAudioRunner.on("synthesized", (message) => {
  bus_evnet.emit(message);
});
makeAudioRunner.on("error", (message) => {
  bus_evnet.emit(message);
});

const main = (message: Message) => {
  orchestratorServer.emitMessage(message);
  switch (message.type) {
    case "comment":
      console.log(message.content);
      for (const command of commands) {
        if (command.isTarget(message)) {
          const synthesizeMessage = command.synthesize(message);
          if (synthesizeMessage) {
            bus_evnet.emit(synthesizeMessage);
          }
          const commandMessages = command.action(message);
          commandMessages.forEach((message) => {
            bus_evnet.emit(message);
          });
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
      //const educationConfigs = getEducationConfigs();
      //const cleanText = clean(message.content, educationConfigs);
      //makeAudioRunner.addQueue(cleanText, message.tag);
      makeAudioRunner.addQueue(message.content, message.tag);
      break;
    }
  }
};

bus_evnet.on(main);
