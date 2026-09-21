export class EventEmitter<T extends { [K in keyof T]: unknown[] }> {
  private _listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};

  public on = <K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => void,
  ) => {
    const listeners = this._listeners[event] ?? [];
    listeners.push(listener);
    this._listeners[event] = listeners;
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  };

  public emit = <K extends keyof T>(event: K, ...args: T[K]) => {
    this._listeners[event]?.slice().forEach((listener) => {
      listener(...args);
    });
  };
}
