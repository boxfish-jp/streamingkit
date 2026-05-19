import * as cheerio from "cheerio";
import { EventEmitter } from "event_emitter";
import type { Message } from "kit_models";
import Innertube, { UniversalCache, YTNodes } from "youtubei.js";

interface YoutubeClientMessage {
  onMessage: [message: Message];
}

export class YoutubeClient extends EventEmitter<YoutubeClientMessage> {
  private _running = false;
  private _channelHandler: string;

  constructor(channelHandler: string) {
    super();
    this._channelHandler = channelHandler;
  }

  async getLiveChatId(): Promise<string | null> {
    const liveId = await this._getliveId(this._channelHandler);
    if (!liveId) {
      return null;
    }
    return liveId;
  }

  async startGetChat(liveId: string): Promise<void> {
    if (this._running) return;
    this._running = true;

    const innertube = await Innertube.create({
      cache: new UniversalCache(false),
    });
    const videoInfo = await innertube.getInfo(liveId);
    const livechat = videoInfo.getLiveChat();
    livechat.on("start", (initial) =>
      console.log("youtube livechat started", initial),
    );
    livechat.on("chat-update", (action) => {
      if (!action.is(YTNodes.AddChatItemAction)) {
        return;
      }
      const item = action.as(YTNodes.AddChatItemAction).item;
      if (!item) {
        return;
      }

      switch (item.type) {
        case "LiveChatTextMessage":
        case "LiveChatPaidMessage": {
          const message = item.as(YTNodes.LiveChatTextMessage);
          const userId = message.author.id;
          const userName = message.author.name;
          const content = message.message.text;
          if (userId !== "UCSvjQBDgYDB5TGVmCZObcwA" && content) {
            this.emit("onMessage", {
              type: "comment",
              label: "viewer",
              site: "youtube",
              username: userName,
              rawUserId: userId,
              hashedUserId: userId,
              content,
            });
            console.log(`[YouTube] ${userName} (${userId}): ${content}`);
            break;
          }
        }
      }
    });
    livechat.on("error", (err: unknown) => {
      this.emit("onMessage", {
        type: "error",
        status: "serverFailedToGetYoutubeComment",
        time: Date.now(),
        message: `Youtube API Error :${err instanceof Error ? err.message : err}`,
      });
    });
    livechat.on("end", () => console.log("livechat end"));

    livechat.start();
  }

  stopGetChat(): void {
    this._running = false;
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
