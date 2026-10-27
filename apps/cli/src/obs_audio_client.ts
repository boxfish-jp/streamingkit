import { OBSWebSocket } from "obs-websocket-js";

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

interface ObsAudioClientOptions {
  url: string;
  inputName?: string;
  onMuteApplied?: (muted: boolean) => void;
}

export class ObsAudioClient {
  private _obs: OBSWebSocket;
  private _url: string;
  private _inputName: string | null;
  private _onMuteApplied?: (muted: boolean) => void;
  private _connected = false;
  private _connecting = false;
  private _disposed = false;
  private _desiredMuted: boolean | null = null;
  private _appliedMuted: boolean | null = null;
  private _announcedMuted: boolean | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
  private _applyQueue: Promise<void> = Promise.resolve();

  constructor(
    options: ObsAudioClientOptions,
    obs: OBSWebSocket = new OBSWebSocket(),
  ) {
    this._obs = obs;
    this._url = options.url;
    this._inputName = options.inputName?.trim() || null;
    this._onMuteApplied = options.onMuteApplied;
    this._obs.on("Identified", this._onIdentified);
    this._obs.on("ConnectionClosed", this._onConnectionClosed);
  }

  async start() {
    await this._connect();
  }

  setMuted(muted: boolean) {
    this._desiredMuted = muted;
    return this._enqueueApply();
  }

  async dispose() {
    this._disposed = true;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    this._reconnectTimer = null;
    this._obs.off("Identified", this._onIdentified);
    this._obs.off("ConnectionClosed", this._onConnectionClosed);
    if (!this._connected) return;
    this._connected = false;
    await this._obs.disconnect().catch(() => {});
  }

  private _connect = async () => {
    if (this._disposed || this._connected || this._connecting) return;
    this._connecting = true;
    try {
      await this._obs.connect(this._url);
    } catch (error) {
      if (!this._disposed) {
        console.error(
          "OBS WebSocketに接続できませんでした。再試行します",
          error,
        );
        this._scheduleReconnect();
      }
    } finally {
      this._connecting = false;
    }
  };

  private _onIdentified = async () => {
    if (this._disposed) {
      await this._obs.disconnect().catch(() => {});
      return;
    }
    this._connected = true;
    this._reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
    this._appliedMuted = null;
    await this._resolveInputName();
    await this._enqueueApply();
    console.log("OBS WebSocketに接続しました");
  };

  private _resolveInputName = async () => {
    if (this._inputName) return;
    try {
      const { desktop1, desktop2 } = await this._obs.call("GetSpecialInputs");
      this._inputName = desktop1 || desktop2 || null;
      if (this._inputName) {
        console.log(`OBS: 音声ソース "${this._inputName}" を使用します`);
      } else {
        console.error(
          "OBS: デスクトップ音声が見つかりません。--obs-inputで音声ソース名を指定してください",
        );
      }
    } catch (error) {
      console.error("OBS: デスクトップ音声の取得に失敗しました", error);
    }
  };

  private _onConnectionClosed = (error: unknown) => {
    const wasConnected = this._connected;
    this._connected = false;
    this._appliedMuted = null;
    if (this._disposed) return;
    if (wasConnected) {
      console.error("OBS WebSocketの接続が切れました", error);
    }
    this._scheduleReconnect();
  };

  private _scheduleReconnect = () => {
    if (this._disposed || this._reconnectTimer) return;
    const delay = this._reconnectDelayMs;
    this._reconnectDelayMs = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      void this._connect();
    }, delay);
  };

  private _enqueueApply = () => {
    this._applyQueue = this._applyQueue.then(
      this._applyDesiredMute,
      this._applyDesiredMute,
    );
    return this._applyQueue;
  };

  private _applyDesiredMute = async () => {
    const inputName = this._inputName;
    const target = this._desiredMuted;
    if (
      this._disposed ||
      !this._connected ||
      !inputName ||
      target === null ||
      target === this._appliedMuted
    )
      return;
    this._appliedMuted = target;
    try {
      await this._obs.call("SetInputMute", {
        inputName,
        inputMuted: target,
      });
      console.log(
        target
          ? `OBS: "${inputName}" をミュートしました`
          : `OBS: "${inputName}" のミュートを解除しました`,
      );
      if (this._announcedMuted !== target) {
        this._announcedMuted = target;
        try {
          this._onMuteApplied?.(target);
        } catch (error) {
          console.error("OBS: ミュート通知に失敗しました", error);
        }
      }
    } catch (error) {
      if (this._appliedMuted === target) this._appliedMuted = null;
      console.error(`OBS: "${inputName}" のミュート設定に失敗しました`, error);
    }
  };
}
