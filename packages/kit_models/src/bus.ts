import type { Message } from "./message.js";

export class Bus {
  private _listeners: Array<(message: Message) => void> = [];

  emit(message: Message) {
    this._listeners.forEach((listener) => {
      listener(message);
    });
  }

  on(listener: (message: Message) => void) {
    this._listeners.push(listener);
  }
}
