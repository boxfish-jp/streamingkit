import { AudioHandler } from "./audio";
import type { Comment } from "./comment";

export class Player {
	private _queue: Comment[] = [];
	private isProcessing = false;

	addQueue(comment: Comment) {
		this._queue.push(comment);
		if (this._queue.length && !this.isProcessing) {
			this._play();
		}
	}

	private async _play() {
		this.isProcessing = true;
		const comment = this._queue[0];
		const audio = new AudioHandler(comment.content);
		const wavData = await audio.getVoicePeakData();
		if (wavData === undefined) {
			return;
		}
		await audio.play(wavData);
		this._queue.shift();
		if (this._queue.length === 0) {
			this.isProcessing = false;
			return;
		}
		this._play();
	}
}
