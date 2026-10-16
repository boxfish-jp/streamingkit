import type { InstSyntesizeMessage } from "kit_models";

export class TimeSignal {
  private _lastSignalKey: string | null = null;

  constructor(
    private _getIsStreaming: () => boolean,
    private _onMessage: (msg: InstSyntesizeMessage) => void,
  ) {
    setInterval(() => this._check(), 30_000);
  }

  private _check(): void {
    if (!this._getIsStreaming()) return;

    const now = new Date();
    const parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const hour = parseInt(
      parts.find((p) => p.type === "hour")?.value ?? "0",
      10,
    );
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10,
    );

    if (minute !== 0 && minute !== 30) {
      this._lastSignalKey = null;
      return;
    }

    const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    if (this._lastSignalKey === key) return;

    const period = hour < 12 ? "午前" : "午後";
    const hour12 = hour % 12;
    const content =
      minute === 0
        ? `${period}${hour12}時ぐらいです`
        : `${period}${hour12}時${minute}分ぐらいです`;

    this._onMessage({
      type: "instSynthesize",
      content,
      channel: 4,
    });
    this._lastSignalKey = key;
  }
}
