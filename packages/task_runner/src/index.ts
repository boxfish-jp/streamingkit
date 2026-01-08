type Task = () => Promise<void>;
type OnError = (error: unknown) => void;

export class TaskRunner {
  private _queue: Array<{ task: Task; onError?: OnError }> = [];
  private _isProcessing = false;

  addQueue(task: Task, onError?: OnError) {
    this._queue.push({ task, onError });
    if (!this._isProcessing) {
      this._processQueue();
    }
  }

  private async _processQueue() {
    this._isProcessing = true;

    while (this._queue.length > 0) {
      const item = this._queue.shift();
      if (!item) continue;
      try {
        await item.task();
      } catch (error) {
        if (item.onError) {
          item.onError(error);
        } else {
          console.error(error);
        }
      }
    }
    this._isProcessing = false;
  }
}
