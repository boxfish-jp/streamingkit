import type { AudioQueueItem } from "./audio_queue";

export class Player {
  private _audioContext: AudioContext;
  private _gainNode: GainNode;

  constructor() {
    this._audioContext = new AudioContext();
    this._gainNode = this._audioContext.createGain();
  }

  async play(item: AudioQueueItem) {
    const source = this._audioContext.createBufferSource();
    try {
      const audioBuffer = await this._audioContext.decodeAudioData(
        item.audioData as any,
      );
      source.buffer = audioBuffer;
      this._gainNode.gain.setValueAtTime(
        item.volume / 50,
        this._audioContext.currentTime,
      );

      try {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        await (this._audioContext as any).setSinkId(item.deviceId);
      } catch (error) {
        console.error(
          `デバイス(${item.deviceId})への出力設定に失敗しました:`,
          error,
        );
      }

      source.connect(this._gainNode);
      this._gainNode.connect(this._audioContext.destination);

      source.start();

      const timeout = setTimeout(() => {
        throw new Error("Audio playback timed out after 30 seconds");
      }, 30000);
      await new Promise<void>((resolve) => {
        source.onended = async () => {
          resolve();
        };
      });
      clearTimeout(timeout);
    } catch (error) {
      console.error(error);
    } finally {
      // ノード間の接続を解除
      this._gainNode.disconnect();
      source.disconnect();
    }
  }
}
