import { EventEmitter } from "node:events";
import type { Message } from "kit_models";
import { NicoNicoClient } from "niconico_client";
import { YoutubeClient } from "youtube_client";
import type { NightbotClient } from "./nightbot.js";

interface StreamingMessage {
  onMessage: [message: Message];
}

export class Streaming extends EventEmitter<StreamingMessage> {
  private _checkIsStreamingIntervalMs = 30000;
  private _nicoNicoClient: NicoNicoClient;
  private _youtubeClient: YoutubeClient;
  private _nightbotClient: NightbotClient;
  private _wasYoutubeStreaming = false;
  private _wasNicoNicoStreaming = false;

  get isStreaming(): boolean {
    return this._wasYoutubeStreaming || this._wasNicoNicoStreaming;
  }

  constructor(
    nicoUserId: string,
    channelId: string,
    nightbotClient: NightbotClient,
    headlessBrowserUrl: string,
  ) {
    super();
    this._nightbotClient = nightbotClient;
    this._nicoNicoClient = new NicoNicoClient(nicoUserId, headlessBrowserUrl);
    this._nicoNicoClient.on("message", (message) => {
      this.emit("onMessage", message);
    });
    this._youtubeClient = new YoutubeClient(channelId);
    this._youtubeClient.on("onMessage", (message) => {
      this.emit("onMessage", message);
    });
  }

  setWasYoutubeStreaming(isStreaming: boolean): void {
    this._wasYoutubeStreaming = isStreaming;
  }

  setWasNicoNicoStreaming(isStreaming: boolean): void {
    this._wasNicoNicoStreaming = isStreaming;
  }

  public startWatchYoutubeComment(chatId: string) {
    this._youtubeClient.startGetChat(chatId);
  }

  public startWatchNicoNicoComment(liveId: string) {
    this._nicoNicoClient.start(liveId);
  }

  public stopWatchYoutubeComment() {
    this._youtubeClient.stopGetChat();
  }

  public stopWatchNicoNicoComment() {
    this._nicoNicoClient.stop();
  }

  async startPooling() {
    this._pollOnce();
    setInterval(async () => {
      this._pollOnce();
    }, this._checkIsStreamingIntervalMs);
  }

  async sendComment(site: "niconico" | "youtube", content: string) {
    switch (site) {
      case "niconico":
        this._nicoNicoClient.sendComment(content);
        break;
      case "youtube":
        this._nightbotClient.sendComment(content);
    }
  }

  private _pollOnce = async () => {
    try {
      const nicoStreamId = await this._nicoNicoClient.getStreamingId();
      this.emit("onMessage", {
        type: "streaming_info",
        site: "niconico",
        wasStreaming: this._wasNicoNicoStreaming,
        isStreaming: nicoStreamId !== null,
        streamId: nicoStreamId ?? undefined,
      });
      const youtubeChatId = await this._youtubeClient.getLiveChatId();
      this.emit("onMessage", {
        type: "streaming_info",
        site: "youtube",
        wasStreaming: this._wasYoutubeStreaming,
        isStreaming: youtubeChatId !== null,
        streamId: youtubeChatId ?? undefined,
      });
    } catch (error) {
      this.emit("onMessage", {
        type: "error",
        status: "serverGetStreamInfo",
        time: Date.now(),
        message: `${error instanceof Error ? error.message : error}`,
      });
    }
  };
}
