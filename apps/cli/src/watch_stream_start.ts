import type { StreamInfoMessage } from "kit_models";

const DEFAULT_GRACE_MS = 15_000;

interface WatchStreamStartOptions {
  onWarning: () => void;
  graceMs?: number;
}

export class WatchStreamStart {
  private _onWarning: () => void;
  private _graceMs: number;
  private _streaming = false;
  private _streamingSites = new Set<StreamInfoMessage["site"]>();
  private _warningTimer: ReturnType<typeof setTimeout> | null = null;
  private _warned = false;
  private _disposed = false;

  constructor(options: WatchStreamStartOptions) {
    this._onWarning = options.onWarning;
    this._graceMs = options.graceMs ?? DEFAULT_GRACE_MS;
  }

  handleStreaming = (isStreaming: boolean) => {
    if (this._disposed) return;
    this._streaming = isStreaming;
    if (!isStreaming) this._resetWarning();
    this._syncWarning();
  };

  handleStreamingInfo = (message: StreamInfoMessage) => {
    if (this._disposed) return;
    if (message.isStreaming) {
      this._streamingSites.add(message.site);
    } else {
      this._streamingSites.delete(message.site);
    }
    if (this._streamingSites.size === 0) this._resetWarning();
    this._syncWarning();
  };

  dispose() {
    this._disposed = true;
    this._clearWarningTimer();
  }

  private _shouldWarn = () =>
    !this._disposed &&
    !this._streaming &&
    this._streamingSites.size > 0 &&
    !this._warned;

  private _syncWarning = () => {
    if (!this._shouldWarn()) {
      this._clearWarningTimer();
      return;
    }
    if (this._warningTimer) return;
    this._warningTimer = setTimeout(this._warn, this._graceMs);
  };

  private _warn = () => {
    this._warningTimer = null;
    if (!this._shouldWarn()) return;
    this._warned = true;
    this._onWarning();
  };

  private _resetWarning = () => {
    this._warned = false;
    this._clearWarningTimer();
  };

  private _clearWarningTimer = () => {
    if (this._warningTimer) clearTimeout(this._warningTimer);
    this._warningTimer = null;
  };
}
