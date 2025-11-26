export class StreamInfo {
  private _streamId: number | undefined = undefined; // 生放送IDのうち、lv以降の数字
  private _userId: string; // ニコニコのuserId
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000; // 配信しているかをポーリングする時間間隔

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
    return `https://api.feed.nicovideo.jp/v1/activities/actors/users/${this.userId}/publish?context=user_timeline_${this.userId}`;
  }

  startPooling(): void {
    this._poolingId = setInterval(async () => {
      if (!this.isStreaming) {
        await this.checkIsStreaming();
      }
    }, this._checkIsStreamingIntervalMs);
  }

  async checkIsStreaming(): Promise<void> {
    try {
      const response = await fetch(this.checkIsStreamingUrl, {
        method: "GET",
        headers: {
          "X-Frontend-Id": "6",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const json = await response.json();
      // jsonの中の一番最初の番組(最新)のラベルを探す。
      const label = json.activities[0]?.label?.text;
      if (!label) {
        throw new Error("No label found in response");
      }
      if (label === "LIVE") {
        // その番組のlvから始まるIDを取得する。
        const streamId = json.activities[0]?.content?.id;
        if (!streamId) {
          throw new Error("streamId not found in response");
        }
        this._setStreamId(streamId);
      }
    } catch (error) {
      //TODO: エラーをバスに流す処理の追加
    }
  }
}

//export const streamInfo = new StreamInfo("98746932");
