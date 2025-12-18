import { EventEmitter } from "node:events";
import type { ErrorMessage, StreamInfoMessage } from "kit_models";

interface CheckStreamInfoMessages {
  streamInfo: [message: StreamInfoMessage];
  error: [message: ErrorMessage];
}

export class CheckStreamInfo extends EventEmitter<CheckStreamInfoMessages> {
  private _streamId: number | undefined = undefined; // 生放送IDのうち、lv以降の数字
  private _userId: string; // ニコニコのuserId
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000; // 配信しているかをポーリングする時間間隔

  constructor(userId: string) {
    super();
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
      this.emit("error", {
        type: "error",
        status: "serverGetStreamInfo",
        time: Date.now(),
        message: String(error),
      });
    }
    this.emit("streamInfo", {
      type: "streaming_info",
      isStreaming: this.isStreaming,
      streamId: this.streamId,
    });
  }
}

//export const streamInfo = new StreamInfo("98746932");
