export interface AudioQueueItem {
  deviceId: string;
  audioData: Uint8Array;
  volume: number;
  onEnded: () => Promise<void>;
}

export class AudioQueue {
  private _audioItems: AudioQueueItem[] = [];

  get length() {
    return this._audioItems.length;
  }

  push(item: AudioQueueItem) {
    this._audioItems.push(item);
  }

  pop() {
    return this._audioItems.shift();
  }
}
