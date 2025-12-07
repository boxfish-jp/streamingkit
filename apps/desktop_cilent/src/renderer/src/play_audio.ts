import { AudioQueue, type AudioQueueItem } from "./lib/audio_queue";
import { Player } from "./lib/player";

class PlayAudioManager {
	private _queue: AudioQueue;
	private _player: Player;
	private _isProcessing = false;

	constructor() {
		this._queue = new AudioQueue();
		this._player = new Player();
	}

	async addQueue(item: AudioQueueItem) {
		this._queue.push(item);
		this._play();
	}

	private async _play() {
		if (!this._isProcessing) {
			try {
				this._isProcessing = true;
				while (this._queue.length > 0) {
					const item = this._queue.pop();
					if (item) {
						await this._player.play(item);
						await item.onEnded();
					}
				}
			} finally {
				this._isProcessing = false;
			}
		}
	}
}

export const playAudioManagers = [
	new PlayAudioManager(),
	new PlayAudioManager(),
	new PlayAudioManager(),
];
