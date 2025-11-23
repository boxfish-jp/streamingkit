export class StreamInfo {
  private _isStreaming = false;
  private _userId: string;
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000;

  constructor(userId: string) {
    this._userId = userId;
    this.checkIsStreaming();
  }
  get isStreaming(): boolean {
    return this._isStreaming;
  }

  get userId(): string {
    return this._userId;
  }

  get checkIsStreamingUrl(): string {
    return `https://api.feed.nicovideo.jp/v1/activities/actors/users/${this.userId}/publish?context=user_timeline_${this.userId}`;
  }

  startPooling(): void {
    this._poolingId = setInterval(async () => {
      if (!this._isStreaming) {
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
      if (response.ok) {
        const label = (await response.json()).activities[0]?.label?.text;
        if (label) {
          if (label === "LIVE") {
            this._isStreaming = true;
          }
        } else {
          throw new Error("No label found in response");
        }
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      //TODO: エラーをバスに流す処理の追加
    }
  }
}

//export const streamInfo = new StreamInfo("98746932");
