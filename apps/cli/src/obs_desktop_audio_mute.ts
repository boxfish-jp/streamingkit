import type { ObsAudioInputs } from "./obs_audio_inputs.js";
import type { ObsConnection } from "./obs_connection.js";

export interface ObsDesktopAudioMuteOptions {
  onMuteApplied?: (muted: boolean) => void;
}

type MuteConnectionState = "disconnected" | "connected" | "disposed";

export class ObsDesktopAudioMute {
  private _connection: ObsConnection;
  private _inputs: ObsAudioInputs;
  private _onMuteApplied?: (muted: boolean) => void;
  private _state: MuteConnectionState = "disconnected";
  private _desiredMuted: boolean | null = null;
  private _appliedMuted: boolean | null = null;
  private _applyQueue: Promise<void> = Promise.resolve();
  private _removeConnectionListener: () => void;

  constructor(
    connection: ObsConnection,
    inputs: ObsAudioInputs,
    options: ObsDesktopAudioMuteOptions = {},
  ) {
    this._connection = connection;
    this._inputs = inputs;
    this._onMuteApplied = options.onMuteApplied;
    this._removeConnectionListener = connection.onConnectionChanged(
      (connected) => {
        if (connected) {
          void this.syncMuteState();
          return;
        }
        this.handleDisconnected();
      },
    );
  }

  setMuted(muted: boolean): Promise<void> {
    this._desiredMuted = muted;
    return this._enqueueApply();
  }

  syncMuteState = async () => {
    if (this._isDisposed) return;
    this._state = "connected";
    await this._inputs.resolveDesktop();
    if (this._isDisposed) return;
    await this._enqueueApply();
  };

  handleDisconnected = () => {
    if (this._isDisposed) return;
    this._state = "disconnected";
    this._appliedMuted = null;
  };

  dispose() {
    this._state = "disposed";
    this._removeConnectionListener();
  }

  private get _isDisposed(): boolean {
    return this._state === "disposed";
  }

  private _enqueueApply = () => {
    this._applyQueue = this._applyQueue.then(
      this._applyDesiredMuted,
      this._applyDesiredMuted,
    );
    return this._applyQueue;
  };

  private _applyDesiredMuted = async () => {
    const inputName = this._inputs.desktopInputName;
    const target = this._desiredMuted;
    if (
      this._state !== "connected" ||
      !inputName ||
      target === null ||
      target === this._appliedMuted
    )
      return;
    this._appliedMuted = target;
    try {
      await this._connection.call("SetInputMute", {
        inputName,
        inputMuted: target,
      });
      if (this._isDisposed) return;
      console.log(
        target
          ? `OBS: "${inputName}" をミュートしました`
          : `OBS: "${inputName}" のミュートを解除しました`,
      );
      this._announceMuteApplied(target);
    } catch (error) {
      if (this._appliedMuted === target) {
        this._appliedMuted = null;
      }
      console.error(`OBS: "${inputName}" のミュート設定に失敗しました`, error);
    }
  };

  private _announceMuteApplied = (muted: boolean) => {
    try {
      this._onMuteApplied?.(muted);
    } catch (error) {
      console.error("OBS: ミュート通知に失敗しました", error);
    }
  };
}
