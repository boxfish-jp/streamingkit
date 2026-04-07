import { OauthClient } from "oauth_client";
import type { LiveBroadcastsResponse, LiveChatResponse } from "./types.js";

export class YoutubeClient extends OauthClient {
  private _nextPageToken: string | undefined = undefined;
  private _running = false;
  private static _instance: YoutubeClient | null = null;

  static getYoutubeClient(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): YoutubeClient {
    if (!YoutubeClient._instance) {
      YoutubeClient._instance = new YoutubeClient(
        clientId,
        clientSecret,
        refreshToken,
      );
    }
    return YoutubeClient._instance;
  }

  private constructor(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ) {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", refreshToken);
    body.append("client_id", clientId);
    body.append("client_secret", clientSecret);
    super({
      endpoint: "https://oauth2.googleapis.com/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`,
        ).toString("base64")}`,
      },
      body: body,
      errorStatus: "serverFailedToGetYoutubeToken",
    });
  }

  async getLiveChatId(): Promise<string | null> {
    const params = new URLSearchParams({
      mine: "true",
    });
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?${params}`,
        {
          headers: this.headers,
        },
      );

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(responseJson)}`);
      }

      if (!this._isLiveBroadcastsResponse(responseJson)) {
        throw new Error("Invalid response");
      }
      if (responseJson.items.length === 0) {
        return null;
      }

      const chatId = responseJson.items[0].snippet?.liveChatId;
      const status = responseJson.items[0].status.lifeCycleStatus === "live";

      if (!chatId) {
        throw new Error("invalid item");
      }
      return status ? chatId : null;
    } catch (error) {
      throw new Error(
        `failed to get youtube chat id: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async startGetChat(liveChatId: string): Promise<void> {
    if (this._running) return;
    this._running = true;
    this._nextPageToken = undefined;

    while (this._running) {
      try {
        const { nextToken, interval } = await this._pollOnce(liveChatId);
        this._nextPageToken = nextToken;
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (err) {
        this.emit("onMessage", {
          type: "error",
          status: "serverFailedToGetYoutubeComment",
          time: Date.now(),
          message: `Youtube API Error :${err instanceof Error ? err.message : err}`,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stopGetChat(): void {
    this._running = false;
  }

  private async _pollOnce(
    liveChatId: string,
  ): Promise<{ nextToken?: string; interval: number }> {
    const params = new URLSearchParams({
      part: "snippet,authorDetails",
      liveChatId: liveChatId,
      maxResults: "100",
    });
    if (this._nextPageToken) {
      params.append("pageToken", this._nextPageToken);
    }
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?${params}`,
      {
        headers: this.headers,
      },
    );

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(
        `failed to get chat: ${response.status}: ${JSON.stringify(responseJson)}`,
      );
    }
    if (!this._isLiveChatResponse(responseJson)) {
      throw new Error(
        `invalid response format: ${JSON.stringify(responseJson)}`,
      );
    }

    for (const item of responseJson.items || []) {
      const username = item.authorDetails.displayName;
      const userId = item.authorDetails.channelId;
      const content = item.snippet.displayMessage;
      this.emit("onMessage", {
        type: "comment",
        label: "viewer",
        username,
        rawUserId: userId,
        hashedUserId: userId,
        content,
      });
    }

    return {
      nextToken: responseJson.nextPageToken,
      interval: responseJson.pollingIntervalMillis || 2000,
    };
  }

  private _isLiveBroadcastsResponse(
    data: unknown,
  ): data is LiveBroadcastsResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "items" in data &&
      Array.isArray((data as LiveBroadcastsResponse).items)
    );
  }

  private _isLiveChatResponse(data: unknown): data is LiveChatResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "items" in data &&
      Array.isArray((data as LiveChatResponse).items) &&
      "pollingIntervalMillis" in data &&
      typeof (data as LiveChatResponse).pollingIntervalMillis === "number"
    );
  }
}
