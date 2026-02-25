export class EventEmitter<T extends { [K in keyof T]: unknown[] }> {
  private _listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};

  public on = <K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => void,
  ) => {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  };

  public emit = <K extends keyof T>(event: K, ...args: T[K]) => {
    this._listeners[event]?.forEach((listener) => listener(...args));
  };
}
