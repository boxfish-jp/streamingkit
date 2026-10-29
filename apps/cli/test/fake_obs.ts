import type { OBSWebSocket } from "obs-websocket-js";
import { vi } from "vitest";
import {
  ObsConnection,
  type ObsConnectionOptions,
} from "../src/obs_connection.js";

type Listener = (...args: unknown[]) => void;

export class FakeObs {
  private _listeners = new Map<string, Set<Listener>>();
  public specialInputs = {
    desktop1: "デスクトップ音声",
    desktop2: "",
    mic1: "マイク",
    mic2: "",
    mic3: "",
    mic4: "",
  };
  public streamOutputActive = false;
  public call = vi.fn(async (requestType: string, _data?: unknown) => {
    switch (requestType) {
      case "GetSpecialInputs":
        return this.specialInputs;
      case "GetStreamStatus":
        return { outputActive: this.streamOutputActive };
      default:
        return {};
    }
  });
  public connect = vi.fn(async (..._args: unknown[]) => ({}));
  public disconnect = vi.fn(async () => {});

  on(event: string, listener: Listener) {
    const listeners = this._listeners.get(event) ?? new Set<Listener>();
    listeners.add(listener);
    this._listeners.set(event, listeners);
  }

  off(event: string, listener: Listener) {
    this._listeners.get(event)?.delete(listener);
  }

  removeAllListeners() {
    this._listeners.clear();
  }

  emit(event: string, ...args: unknown[]) {
    this._listeners.get(event)?.forEach((listener) => {
      listener(...args);
    });
  }
}

export const createObsConnection = (
  fake: FakeObs,
  options: Partial<ObsConnectionOptions> = {},
) =>
  new ObsConnection(
    { url: "ws://127.0.0.1:4455", ...options },
    fake as unknown as OBSWebSocket,
  );

export const flushPromises = async () => {
  for (let index = 0; index < 20; index += 1) {
    await Promise.resolve();
  }
};
