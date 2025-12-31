import { Bus, type PingMessage } from "kit_models";
import clientSocketConnected from "./assets/client_socket_connected.wav";
import endStreamingWav from "./assets/end_streaming.wav";
import spotfiyAddQueue from "./assets/spotify_add_queue.wav";
import startStreamingWav from "./assets/start_streaming.wav";
import { ChannelsManager } from "./channels";
import { ErrorHandler } from "./error";
import type { AudioQueueItem } from "./lib/audio_queue";
import { SocketManager } from "./lib/socket";
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

const errorHandler = new ErrorHandler();

export const startSubscribe = () => {
  const remove = window.api.onAudio(async (value) => {
    await onAudio(value.id, value.channel, value.audio);
  });
  const bus = new Bus();

  const socketManager = SocketManager.instance();
  socketManager.on((message) => {
    bus.emit(message);
  });
  socketManager.connect();

  setInterval(() => {
    bus.emit({ type: "ping", who: "client" } as PingMessage);
  }, 30000);

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
      case "error": {
        const newMessage = await errorHandler.onError(message);
        if (newMessage) {
          bus.emit(newMessage);
        }
        break;
      }
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
          case "successfulAddSpotifyQueue": {
            console.log("Spotify add queue notification received");
            const response = await fetch(spotfiyAddQueue);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              tag: "announce",
            });
            break;
          }
          case "startStreaming": {
            const response = await fetch(startStreamingWav);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              tag: "announce",
            });
            break;
          }
          case "endStreaming": {
            const response = await fetch(endStreamingWav);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              tag: "announce",
            });
          }
        }
    }
  });

  return remove;
};
