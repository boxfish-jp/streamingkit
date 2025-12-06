import type { Message } from "./types/message.js";

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

/*
export const event_bus = new Bus();
const temp: Buffer = Buffer.from([0]);

event_bus.emit({
  type: "synthesized",
  message: new WavData(temp),
});
*/
