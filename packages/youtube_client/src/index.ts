import * as cheerio from "cheerio";
import { EventEmitter } from "event_emitter";
import type { Message } from "kit_models";
import type { LiveChatResponse, VideossResponse } from "./types.js";

interface YoutubeClientMessage {
  onMessage: [message: Message];
}

export class YoutubeClient extends EventEmitter<YoutubeClientMessage> {
  private _nextPageToken: string | undefined = undefined;
  private _running = false;
  private _apiKey: string;
  private _channelHandler: string;

  constructor(apiKey: string, channelHandler: string) {
    super();
    this._apiKey = apiKey;
    this._channelHandler = channelHandler;
  }

  async getLiveChatId(): Promise<string | null> {
    const liveId = await this._getliveId(this._channelHandler);
    if (!liveId) {
      return null;
    }
    const params = new URLSearchParams({
      part: "snippet,liveStreamingDetails",
      id: liveId,
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

      const chatId = this._parseLiveChatId(responseJson);
      if (!chatId) {
        throw new Error("Live chat ID not found in YouTube API response");
      }
      return chatId;
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

  private async _getliveId(channelHandle: string): Promise<string | null> {
    channelHandle = channelHandle.replace(/^@/, "");
    const url = `https://www.youtube.com/@${channelHandle}/live`;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const html = await response.text();
      const $ = cheerio.load(html);

      const meta: Record<string, string> = {};
      $("meta").each((_, elem) => {
        const content = $(elem).attr("content");
        if (!content) {
          return;
        }
        const name = $(elem).attr("name");
        if (name) meta[name] = content;

        const property = $(elem).attr("property");
        if (property) meta[property] = content;

        const itemprop = $(elem).attr("itemprop");
        if (itemprop) meta[`itemprop:${itemprop}`] = content;
      });

      const canonUrl = meta["og:url"] ?? null;

      if (
        !meta["twitter:player"] ||
        meta["itemprop:isLiveBroadcast"] !== "True" ||
        !meta["itemprop:startDate"]
      ) {
        return null;
      }
      if (new Date() <= new Date(meta["itemprop:startDate"])) {
        return null;
      }
      if (!canonUrl) {
        throw new Error("Canonical URL not found in meta tags");
      }
      console.log(`Canonical URL: ${canonUrl}`);

      const urlObj = new URL(canonUrl);
      const vValue = urlObj.searchParams.get("v");
      if (!vValue) {
        throw new Error("Video ID (v) not found in URL");
      }
      return vValue;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "不明なエラーが発生しました";
      console.error(`YouTubeライブページのアクセスに失敗しました: ${message}`);
      throw error;
    }
  }
}
