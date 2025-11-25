export class StreamInfo {
  private _streamId: number | undefined = undefined;
  private _userId: string;
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000;

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

  get streamUrl(): string | undefined {
    return this._streamId
      ? `https://live.nicovideo.jp/watch/lv${this._streamId}`
      : undefined;
  }

  get streamLv(): string | undefined {
    return this._streamId ? `lv${this._streamId}` : undefined;
  }

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
      const label = json.activities[0]?.label?.text;
      if (!label) {
        throw new Error("No label found in response");
      }
      if (label === "LIVE") {
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
