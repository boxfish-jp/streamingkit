export const DEFAULT_CHECK_DELAY_MS = 120_000;

interface WatchMicSignalOptions {
  onWarning: () => void;
  checkDelayMs?: number;
}

export class WatchMicSignal {
  private _onWarning: () => void;
  private _checkDelayMs: number;
  private _hasSignal = false;
  private _sessionActive = false;
  private _checkTimer: ReturnType<typeof setTimeout> | null = null;
  private _disposed = false;

  constructor(options: WatchMicSignalOptions) {
    this._onWarning = options.onWarning;
    this._checkDelayMs = options.checkDelayMs ?? DEFAULT_CHECK_DELAY_MS;
  }

  handleStreaming = (isStreaming: boolean) => {
    if (this._disposed) return;
    if (isStreaming) {
      this._startSession();
    } else {
      this._endSession();
    }
  };

  handleMicPeak = (peak: number) => {
    if (this._disposed) return;
    if (peak > 0) this._hasSignal = true;
  };

  dispose() {
    this._disposed = true;
    this._clearCheckTimer();
  }

  private _startSession = () => {
    if (this._sessionActive) return;
    this._sessionActive = true;
    this._hasSignal = false;
    this._checkTimer = setTimeout(this._checkMic, this._checkDelayMs);
  };

  private _endSession = () => {
    if (!this._sessionActive) return;
    this._sessionActive = false;
    this._hasSignal = false;
    this._clearCheckTimer();
  };

  private _checkMic = () => {
    this._checkTimer = null;
    if (this._disposed || !this._sessionActive) return;
    if (!this._hasSignal) this._onWarning();
  };

  private _clearCheckTimer = () => {
    if (this._checkTimer) clearTimeout(this._checkTimer);
    this._checkTimer = null;
  };
}
