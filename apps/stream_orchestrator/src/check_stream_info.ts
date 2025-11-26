import type { NotifyError } from "./types/error.js";
import type { NotifyStreamingInfoCallback } from "./types/stream_info.js";

export class CheckStreamInfo {
  private _streamId: number | undefined = undefined; // 生放送IDのうち、lv以降の数字
  private _userId: string; // ニコニコのuserId
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000; // 配信しているかをポーリングする時間間隔
  private _notifyStreamingInfoCallbacks: Array<NotifyStreamingInfoCallback> =
    [];
  private _onErrorCallbacks: Array<NotifyError> = [];

  constructor(userId: string) {
    this._userId = userId;
    this.checkIsStreaming();
  }

  private _setStreamId(stringId: string) {
    const id = Number(stringId.replace("lv", ""));

    if (Number.isNaN(id)) {
      throw new Error("cannot parse stream ID");
    }
    this._streamId = id;
  }

  // 配信先のurl
  get streamUrl(): string | undefined {
    return this._streamId
      ? `https://live.nicovideo.jp/watch/lv${this._streamId}`
      : undefined;
  }

  // lvまで含めた配信先のID
  get streamLv(): string | undefined {
    return this._streamId ? `lv${this._streamId}` : undefined;
  }

  // lvは含まない数字のみの配信先ID
  get streamId(): number | undefined {
    return this._streamId;
  }

  get isStreaming(): boolean {
    return this._streamId !== undefined;
  }

  get userId(): string {
    return this._userId;
  }

  get checkIsStreamingUrl(): string {
    return `https://live.nicovideo.jp/front/api/v2/user-broadcast-history?providerId=${this.userId}&providerType=user&isIncludeNonPublic=false&offset=0&limit=2&withTotalCount=true`;
  }

  registerNotifyCallback(callback: NotifyStreamingInfoCallback): void {
    this._notifyStreamingInfoCallbacks.push(callback);
  }

  removeNotifyCallback(callback: NotifyStreamingInfoCallback): void {
    this._notifyStreamingInfoCallbacks =
      this._notifyStreamingInfoCallbacks.filter((cb) => cb !== callback);
  }

  registerOnErrorCallback(callback: NotifyError): void {
    this._onErrorCallbacks.push(callback);
  }

  removeOnErrorCallback(callback: NotifyError): void {
    this._onErrorCallbacks = this._onErrorCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  startPooling(): void {
    this._poolingId = setInterval(async () => {
      await this.checkIsStreaming();
    }, this._checkIsStreamingIntervalMs);
  }

  async checkIsStreaming(): Promise<void> {
    try {
      const response = await fetch(this.checkIsStreamingUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const json = await response.json();
      // jsonの中の一番最初の番組(最新)のラベルを探す。
      const status = json.data?.programsList[0]?.program?.schedule?.status;
      if (!status) {
        throw new Error("No status found in response");
      }
      if (status === "ON_AIR") {
        // その番組のlvから始まるIDを取得する。
        const streamId = json.data?.programsList[0]?.id?.value;
        if (!streamId) {
          throw new Error("streamId not found in response");
        }
        this._setStreamId(streamId);
      } else {
        this._streamId = undefined;
      }
    } catch (error) {
      for (const callback of this._onErrorCallbacks) {
        callback(String(error));
      }
    }
    for (const callback of this._notifyStreamingInfoCallbacks) {
      callback({ isStreaming: this.isStreaming, streamId: this._streamId });
    }
  }
}

//export const streamInfo = new StreamInfo("98746932");
