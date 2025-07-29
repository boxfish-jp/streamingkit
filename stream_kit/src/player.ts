import { AudioHandler } from "./audio";
import type { Comment } from "./comment";

export class Player {
	private _queue: Comment[] = [];
	private isProcessing = false;

	addQueue(comment: Comment) {
		this._queue.push(comment);
		if (!this.isProcessing) {
			this._play();
		}
	}

	private async _play() {
		try {
			this.isProcessing = true;
			while (true) {
				const comment = this._queue[0];
				if (comment === undefined) {
					break;
				}
				const audio = new AudioHandler(comment.content);
				const wavData = await audio.getVoicePeakData();
				if (wavData === undefined) {
					continue;
				}
				this._queue.shift();
				//await audio.play(wavData);
				await audio.sendServer(wavData);
			}
		} finally {
			this.isProcessing = false;
		}
	}
}
