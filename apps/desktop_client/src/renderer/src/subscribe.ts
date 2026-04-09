import { Bus, type PingMessage } from "kit_models";
import clientSocketConnected from "./assets/client_socket_connected.wav";
import endNicoNicoStreaming from "./assets/end_niconico_streaming.wav";
import endYoutubeStreaming from "./assets/end_youtube_streaming.wav";
import spotfiyAddQueue from "./assets/spotify_add_queue.wav";
import startNicoNicoStreaming from "./assets/start_niconico_streaming.wav";
import startYoutubeStreaming from "./assets/start_youtube_streaming.wav";
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
  const bus = new Bus();
  const socketManager = SocketManager.instance();
  socketManager.onMessage((message) => {
    bus.emit(message);
  });
  socketManager.connect();

  const remove = window.api.onAudio(async (value) => {
    await onAudio(value.id, value.channel, value.audio);
  });

  setInterval(() => {
    bus.emit({ type: "ping", who: "client" } as PingMessage);
  }, 30000);

  bus.on(async (message) => {
    switch (message.type) {
      case "synthesized": {
        onAudio(Date.now(), message.channel, message.buffer);
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
              channel: 4,
            });
            break;
          }
          case "successfulAddSpotifyQueue": {
            console.log("Spotify add queue notification received");
            const response = await fetch(spotfiyAddQueue);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              channel: 4,
            });
            break;
          }
          case "startNicoNicoStreaming": {
            const response = await fetch(startNicoNicoStreaming);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              channel: 4,
            });
            break;
          }
          case "endNicoNicoStreaming": {
            const response = await fetch(endNicoNicoStreaming);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              channel: 4,
            });
            break;
          }
          case "startYoutubeStreaming": {
            const response = await fetch(startYoutubeStreaming);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              channel: 4,
            });
            break;
          }
          case "endYoutubeStreaming": {
            const response = await fetch(endYoutubeStreaming);
            bus.emit({
              type: "synthesized",
              buffer: (await response.arrayBuffer()) as any,
              channel: 4,
            });
            break;
          }
        }
    }
  });

  return remove;
};
