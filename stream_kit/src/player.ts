import { AudioHandler } from "./audio";
import type { Comment } from "./comment";

export class Player {
	private _queue: Comment[] = [];

	addQueue(comment: Comment) {
		this._queue.push(comment);
		if (this._queue.length === 1) {
			this.play();
		}
	}

	private async play() {
		const comment = this._queue[0];
		const audio = new AudioHandler(comment.content);
		const wavData = await audio.getVoicePeakData();
		await audio.play(wavData);
		this._queue.shift();
		if (this._queue.length > 0) {
			this.play();
		}
	}
}
