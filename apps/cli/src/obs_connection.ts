import {
  EventSubscription,
  type OBSRequestTypes,
  type OBSResponseTypes,
  OBSWebSocket,
} from "obs-websocket-js";

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface ObsConnectionOptions {
  url: string;
  onConnected?: (connected: boolean) => void;
  onInputVolumeMeters?: (inputs: unknown[]) => void;
  onStreamStateChanged?: (isStreaming: boolean) => void;
}

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disposed";

export class ObsConnection {
  private _obs: OBSWebSocket;
  private _options: ObsConnectionOptions;
  private _status: ConnectionStatus = "disconnected";
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
  private _connectPromise: Promise<void> | null = null;
  private _connectionListeners = new Set<(connected: boolean) => void>();

  constructor(
    options: ObsConnectionOptions,
    obs: OBSWebSocket = new OBSWebSocket(),
  ) {
    this._obs = obs;
    this._options = options;
    if (options.onConnected) {
      this._connectionListeners.add(options.onConnected);
    }
    this._obs.on("Identified", () => {
      this._status = "connected";
      this._reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
      console.log("OBS WebSocketに接続しました");
      this._notifyConnectionChanged(true);
    });
    this._obs.on("ConnectionClosed", (error) => {
      const wasConnected = this._status === "connected";
      this._status = "disconnected";
      if (wasConnected) {
        this._notifyConnectionChanged(false);
        console.error("OBS WebSocketの接続が切れました", error);
      }
      this._scheduleReconnect();
    });
    this._obs.on("InputVolumeMeters", (data) => {
      this._options.onInputVolumeMeters?.(data.inputs);
    });
    this._obs.on("StreamStateChanged", (data) => {
      this._options.onStreamStateChanged?.(data.outputActive);
    });
  }

  onConnectionChanged(listener: (connected: boolean) => void) {
    this._connectionListeners.add(listener);
    return () => {
      this._connectionListeners.delete(listener);
    };
  }

  async start() {
    await this._beginConnect();
  }

  async dispose() {
    const wasConnecting = this._status === "connecting";
    const wasActive = wasConnecting || this._status === "connected";
    this._status = "disposed";
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;
    this._obs.removeAllListeners();
    if (!wasActive) return;
    this._notifyConnectionChanged(false);
    await this._obs.disconnect().catch(() => {});
    if (!wasConnecting) return;
    await this._connectPromise?.catch(() => {});
    await this._obs.disconnect().catch(() => {});
  }

  call<Type extends keyof OBSRequestTypes>(
    requestType: Type,
    requestData?: OBSRequestTypes[Type],
  ): Promise<OBSResponseTypes[Type]> {
    return this._obs.call(requestType, requestData);
  }

  private get _isDisposed(): boolean {
    return this._status === "disposed";
  }

  private _notifyConnectionChanged = (connected: boolean) => {
    for (const listener of [...this._connectionListeners]) {
      try {
        listener(connected);
      } catch (error) {
        console.error("OBS: 接続通知に失敗しました", error);
      }
    }
  };

  private _beginConnect = () => {
    if (!this._connectPromise) {
      this._connectPromise = this._connect().finally(() => {
        this._connectPromise = null;
      });
    }
    return this._connectPromise;
  };

  private _connect = async () => {
    if (this._status !== "disconnected") return;
    this._status = "connecting";
    try {
      await this._obs.connect(this._options.url, undefined, {
        eventSubscriptions:
          EventSubscription.Outputs | EventSubscription.InputVolumeMeters,
      });
    } catch (error) {
      if (!this._isDisposed) {
        console.error(
          "OBS WebSocketに接続できませんでした。再試行します",
          error,
        );
        this._scheduleReconnect();
      }
    } finally {
      if (this._status === "connecting") this._status = "disconnected";
    }
  };

  private _scheduleReconnect = () => {
    if (this._isDisposed || this._reconnectTimer) return;
    const delay = this._reconnectDelayMs;
    this._reconnectDelayMs = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      void this._beginConnect();
    }, delay);
  };
}
