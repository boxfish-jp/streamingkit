import { CheckStreamInfo } from "./check_stream_info.js";
import { clean } from "./clean.js";
import { Bus } from "./event_bus.js";
import { ListenComment } from "./listen_comment.js";
import { SynthesizeRunner } from "./synthesize.js";
import type { Command } from "./types/command.js";
import type { Message } from "./types/message.js";

let isStreaming = false;
// const checkStreamInfo = new CheckStreamInfo("");
const listenComment = new ListenComment();
const makeAudioRunner = new SynthesizeRunner();
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
      if (message.isStreaming && !isStreaming) {
        if (message.streamId) {
          listenComment.start(`lv${message.streamId}`);
        }
        isStreaming = true;
      }
      break;
    case "synthesized":
      break;
    case "instSyntesize": {
      const cleanText = clean(message.content);
      makeAudioRunner.addQueue(cleanText);
      break;
    }
  }
};

const bus_evnet = new Bus();

bus_evnet.on(main);
