import type { Message } from "kit_models";

const DEFAULT_UNMUTE_DELAY_MS = 10_000;

interface WatchAnimeAudioOptions {
  setMuted: (muted: boolean) => Promise<void>;
  unmuteDelayMs?: number;
}

export class WatchAnimeAudio {
  private _setMuted: (muted: boolean) => Promise<void>;
  private _unmuteDelayMs: number;
  private _muted = false;
  private _disposed = false;
  private _unmuteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WatchAnimeAudioOptions) {
    this._setMuted = options.setMuted;
    this._unmuteDelayMs = options.unmuteDelayMs ?? DEFAULT_UNMUTE_DELAY_MS;
  }

  handleMessage(message: Message) {
    if (this._disposed) return;
    if (message.type !== "mediaInfo" || message.kind !== "anime") return;
    if (message.playbackStatus !== "Playing") return;
    this._mute();
    this._scheduleUnmute();
  }

  async dispose() {
    this._disposed = true;
    if (this._unmuteTimer) clearTimeout(this._unmuteTimer);
    this._unmuteTimer = null;
    if (!this._muted) return;
    this._muted = false;
    await this._setMuted(false).catch(() => {});
  }

  private _mute = () => {
    if (this._muted) return;
    this._muted = true;
    void this._setMuted(true).catch((error) => {
      console.error("OBS: ミュートに失敗しました", error);
    });
  };

  private _unmute = () => {
    if (this._unmuteTimer) {
      clearTimeout(this._unmuteTimer);
      this._unmuteTimer = null;
    }
    if (!this._muted) return;
    this._muted = false;
    void this._setMuted(false).catch((error) => {
      console.error("OBS: ミュート解除に失敗しました", error);
    });
  };

  private _scheduleUnmute = () => {
    if (this._unmuteTimer) clearTimeout(this._unmuteTimer);
    this._unmuteTimer = setTimeout(this._unmute, this._unmuteDelayMs);
  };
}
