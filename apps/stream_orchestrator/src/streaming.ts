import { EventEmitter } from "node:events";
import type { Message } from "kit_models";
import { NicoNicoClient } from "niconico_client";
import { YoutubeClient } from "youtube_client";

interface StreamingMessage {
  onMessage: [message: Message];
}

export class Streaming extends EventEmitter<StreamingMessage> {
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _checkIsStreamingIntervalMs = 30000; // 配信しているかをポーリングする時間間隔
  private _nicoNicoClient: NicoNicoClient;
  private _youtubeClient: YoutubeClient;
  private _wasYoutubeStreaming = false;
  private _wasNicoNicoStreaming = false;

  constructor(nicoUserId: string, channelId: string, youtubeApiKey: string) {
    super();
    this._nicoNicoClient = new NicoNicoClient(nicoUserId);
    this._nicoNicoClient.on("message", (message) => {
      this.emit("onMessage", message);
    });
    this._youtubeClient = new YoutubeClient(youtubeApiKey, channelId);

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
    this._poolingId = setInterval(async () => {
      this._pollOnce();
    }, this._checkIsStreamingIntervalMs);
  }

  async sendComment(site: "niconico" | "youtube", content: string) {
    switch (site) {
      case "niconico":
        this._nicoNicoClient.sendComment(content);
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

//export const streamInfo = new StreamInfo("98746932");
