import { EventEmitter } from "event_emitter";
import type { Message } from "kit_models";
import Parser, { type Item } from "rss-parser";
import type { LiveChatResponse, VideossResponse } from "./types.js";

interface YoutubeClientMessage {
  onMessage: [message: Message];
}

export class YoutubeClient extends EventEmitter<YoutubeClientMessage> {
  private _nextPageToken: string | undefined = undefined;
  private _running = false;
  private _apiKey: string;
  private _channelId: string;

  constructor(apiKey: string, channeld: string) {
    super();
    this._apiKey = apiKey;
    this._channelId = channeld;
  }

  async getLiveChatId(): Promise<string | null> {
    const videoIds = await this._getLastVideoId(this._channelId);
    const params = new URLSearchParams({
      part: "snippet,liveStreamingDetails",
      id: videoIds.join(","),
      key: this._apiKey,
    });

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${params}`,
      );

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(responseJson)}`);
      }

      console.log("Response JSON:", responseJson);
      return this._parseLiveChatId(responseJson);
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
      key: this._apiKey,
    });
    if (this._nextPageToken) {
      params.append("pageToken", this._nextPageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?${params}`,
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

  private _isVideoResponse(data: unknown): data is VideossResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "items" in data &&
      Array.isArray((data as VideossResponse).items)
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

  private _parseLiveChatId(responseJson: unknown): string | null {
    if (!this._isVideoResponse(responseJson)) {
      throw new Error("Invalid response format");
    }

    if (responseJson.items.length === 0) {
      console.log("No videos found for the channel.");
      return null;
    }

    for (const item of responseJson.items) {
      console.log(item.snippet.title);
      const liveStatus = item.snippet.liveBroadcastContent === "live";
      if (liveStatus) {
        const chatId = item.liveStreamingDetails.activeLiveChatId;
        if (!chatId) {
          throw new Error("chatId not found in response");
        }
        return chatId;
      }
    }
    return null;
  }

  private async _getLastVideoId(channelId: string): Promise<string[]> {
    const parser = new Parser();

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    try {
      const feed = await parser.parseURL(feedUrl);

      return feed.items
        .map((item: Item) => {
          if (!item.link) return null;

          const urlObj = new URL(item.link);
          const videoId = urlObj.searchParams.get("v") ?? "";

          return videoId;
        })
        .filter((v): v is string => v !== null && v !== "");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      console.error("❌ RSSの取得に失敗しました:", message);
      throw error;
    }
  }
}
