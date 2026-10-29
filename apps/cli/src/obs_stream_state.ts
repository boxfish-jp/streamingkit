import type { ObsConnection } from "./obs_connection.js";

export interface ObsStreamStateOptions {
  onChanged: (isStreaming: boolean) => void;
}

export class ObsStreamState {
  private _connection: ObsConnection;
  private _onChanged: (isStreaming: boolean) => void;
  private _isStreaming = false;
  private _disposed = false;
  private _removeConnectionListener: () => void;

  constructor(connection: ObsConnection, options: ObsStreamStateOptions) {
    this._connection = connection;
    this._onChanged = options.onChanged;
    this._removeConnectionListener = connection.onConnectionChanged(
      (connected) => {
        if (connected) {
          void this.sync();
          return;
        }
        this.handleStreamStateChanged(false);
      },
    );
  }

  get isStreaming() {
    return this._isStreaming;
  }

  sync = async () => {
    if (this._disposed) return;
    try {
      const { outputActive } = await this._connection.call("GetStreamStatus");
      this._update(outputActive);
    } catch (error) {
      console.error("OBS: 配信状態の取得に失敗しました", error);
    }
  };

  handleStreamStateChanged = (isStreaming: boolean) => {
    this._update(isStreaming);
  };

  dispose() {
    this._disposed = true;
    this._removeConnectionListener();
  }

  private _update = (isStreaming: boolean) => {
    if (this._disposed || this._isStreaming === isStreaming) return;
    this._isStreaming = isStreaming;
    this._onChanged(isStreaming);
  };
}
