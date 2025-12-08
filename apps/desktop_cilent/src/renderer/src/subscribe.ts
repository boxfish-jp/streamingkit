import { Bus } from "kit_models";
import clientSocketConnected from "./assets/client_socket_connected.wav";
import clientSocketConnectionErrorWav from "./assets/client_socket_connection_error.wav";
import clientSocketDisconectedWav from "./assets/client_socket_disconnected.wav";
import { ChannelsManager } from "./channels";
import type { AudioQueueItem } from "./lib/audio_queue";
import { connectSocket } from "./lib/socket";
import { playAudioManagers } from "./play_audio";

const onAudio = async (
  audioId: number,
  channelId: number,
  audioData: Buffer,
) => {
  const channelsManager = ChannelsManager.instance();
  try {
    const item: AudioQueueItem = {
      deviceId: channelsManager.getDeviceId(channelId),
      audioData: audioData,
      volume: channelsManager.getVolume(channelId),
      onEnded: async () => {
        window.api.onFinish(audioId, "ok");
      },
    };
    switch (channelId) {
      case 0:
      case 1:
        playAudioManagers[0].addQueue(item);
        break;
      case 2:
      case 3:
        playAudioManagers[1].addQueue(item);
        break;
      case 4:
        playAudioManagers[2].addQueue(item);
        break;
      default:
        throw new Error("Invalid channel number");
    }
  } catch (e) {
    window.api.onFinish(audioId, "Invalid channel number");
  }
};

let lastError = { status: "", time: 0 };

export const startSubscribe = () => {
  const remove = window.api.onAudio(async (value) => {
    await onAudio(value.id, value.channel, value.audio);
  });
  const bus = new Bus();

  connectSocket(async (message) => {
    bus.emit(message);
  });

  bus.on(async (message) => {
    switch (message.type) {
      case "synthesized": {
        let channel = 0;
        if (message.channel) {
          channel = message.channel;
        } else if (message.tag === "announce") {
          channel = 4;
        }
        onAudio(Date.now(), channel, message.buffer);
        break;
      }
      case "error":
        switch (message.status) {
          case "clientSocketConnection":
            if (
              lastError.status !== message.status ||
              lastError.time + 30000 < message.time
            ) {
              const response = await fetch(clientSocketConnectionErrorWav);
              bus.emit({
                type: "synthesized",
                buffer: (await response.arrayBuffer()) as any,
                tag: "announce",
              });
              lastError = { status: message.status, time: Date.now() };
            }
            break;
          case "clientSocketDisconnected":
            if (
              lastError.status !== message.status ||
              lastError.time + 30000 < message.time
            ) {
              const response = await fetch(clientSocketDisconectedWav);
              bus.emit({
                type: "synthesized",
                buffer: (await response.arrayBuffer()) as any,
                tag: "announce",
              });
              lastError = { status: message.status, time: Date.now() };
            }
            break;
        }
        break;
      case "notify":
        switch (message.status) {
          case "clientSocketConnected": {
            console.log("Socket connected notification received");
            const response = await fetch(clientSocketConnected);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              tag: "announce",
            });
            break;
          }
        }
    }
  });

  return remove;
};
