import { CheckStreamInfo } from "./check_stream_info.js";
import { clean } from "./clean.js";
import { getEducationConfigs } from "./education.js";
import { Bus } from "./event_bus.js";
import { ListenComment } from "./listen_comment.js";
import type { Command } from "./model/command.js";
import type { Message } from "./model/message.js";
import { SynthesizeRunner } from "./synthesize.js";

let isStreaming = false;
// const checkStreamInfo = new CheckStreamInfo("");
const listenComment = new ListenComment();
const makeAudioRunner = new SynthesizeRunner();
// TODO: コマンド追加の実装
const commands: Command[] = [];

const main = (message: Message) => {
  switch (message.type) {
    case "comment":
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
      bus_evnet.emit({ type: "instSyntesize", content: message.content });
      break;
    case "streaming_info":
      if (message.isStreaming) {
        if (message.streamId && !isStreaming) {
          // TODO: 配信の開始を検知したことをユーザーに通知する処理の実装
          listenComment.start(`lv${message.streamId}`);
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
    case "instSyntesize": {
      const educationConfigs = getEducationConfigs();
      const cleanText = clean(message.content, educationConfigs);
      makeAudioRunner.addQueue(cleanText);
      break;
    }
  }
};

const bus_evnet = new Bus();

bus_evnet.on(main);
