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

export const startSubscribeAudio = () => {
  const remove = window.api.onAudio(async (value) => {
    await onAudio(value.id, value.channel, value.audio);
  });
  return remove;
};

export const startConnectSocket = () => {
  connectSocket(async (message) => {
    switch (message.tag) {
      case "comment":
        await onAudio(Date.now(), 0, message.buffer);
    }
  });
};
