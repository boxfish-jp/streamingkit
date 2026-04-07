import type {
  Chat,
  Gift,
  Nicoad,
  NicoliveState,
  SimpleNotification,
  SimpleNotificationV2,
} from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node.js";
import { EventEmitter } from "event_emitter";
import type { CommentMessage, ErrorMessage, Message } from "kit_models";

interface CheckStreamInfoMessages {
  message: [message: Message];
}

export class NicoNicoClient extends EventEmitter<CheckStreamInfoMessages> {
  private _streamId: number | undefined = undefined; // 生放送IDのうち、lv以降の数字
  private _userId: string; // ニコニコのuserId
  private _poolingId: NodeJS.Timeout | undefined = undefined;
  private _stopListen: (() => void) | null = null;
  private _viewers = 0;

  constructor(userId: string) {
    super();
    this._userId = userId;
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

  async getStreamingId(): Promise<string | null> {
    try {
      const response = await fetch(this.checkIsStreamingUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const json = await response.json();
      const streamId = this._parseStreamId(json);
      if (streamId) {
        this._setStreamId(streamId);
      }
      return streamId;
    } catch (error) {
      throw new Error(
        `failed to get niconico stream id: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  public start = async (lvid: string) => {
    try {
      let client: NicoliveClient | null = new NicoliveClient({
        liveId: lvid,
      });
      client
        .on("chat", this._onChat)
        .on("simpleNotification", this._onSimpleNotification)
        .on("simpleNotificationV2", this._onSimpleNotificationV2)
        .on("changeState", this._onChangeState)
        .on("gift", this._onGift)
        .on("nicoad", this._onNicoAd);
      await client.connect();
      this._stopListen = () => {
        try {
          client?.disconnect();
          client = null;
        } catch (error) {
          this.emit("message", {
            type: "error",
            status: "serverStopComment",
            time: Date.now(),
            message: error,
          } as ErrorMessage);
        }
      };
    } catch (error) {
      this.emit("message", {
        type: "error",
        status: "serverWatchComment",
        time: Date.now(),
        message: error,
      } as ErrorMessage);
    }
  };

  public stop = () => {
    this._stopListen?.();
  };

  private _onChat = (chat: Chat) => {
    if (chat.rawUserId === 98746932n) {
      return;
    }
    this.emit("message", {
      type: "comment",
      label: "viewer",
      content: chat.content,
      username: chat.name,
      rawUserId: chat.rawUserId?.toString(),
      hashedUserId: chat.hashedUserId,
    } as CommentMessage);
  };

  private _onSimpleNotification = (notification: SimpleNotification) => {
    const content = notification.message.value;
    if (!content) {
      return;
    }
    this.emit("message", {
      type: "comment",
      label: "bot",
      content: content,
    } as CommentMessage);
  };

  private _onSimpleNotificationV2 = (notification: SimpleNotificationV2) => {
    const content = notification.message;
    if (!content) {
      return;
    }
    this.emit("message", {
      type: "comment",
      label: "bot",
      content: content,
    } as CommentMessage);
  };

  private _onChangeState = (state: NicoliveState) => {
    const nusiCome = state.marquee?.display?.operatorComment?.content;
    if (nusiCome) {
      this.emit("message", {
        type: "comment",
        label: "fuguo",
        content: nusiCome,
      } as CommentMessage);
    }
    const latestViewers = Number(state.statistics?.viewers);
    if (!Number.isNaN(latestViewers) && this._viewers < latestViewers) {
      this.emit("message", {
        type: "viewerCountUpdate",
        site: "niconico",
        viewerCount: latestViewers,
      });
      this._viewers = latestViewers;
    }
  };

  private _onGift = (gift: Gift) => {
    const rankingMessage =
      gift.contributionRank == null
        ? ""
        : `ギフト貢献${gift.contributionRank}位`;
    this.emit("message", {
      type: "comment",
      label: "bot",
      content: `${rankingMessage} ${gift.advertiserName}さんがギフト「${gift.itemName} (${gift.point}pt)」を贈りました。「${gift.message}」`,
    } as CommentMessage);
  };

  private _onNicoAd = (nicoAd: Nicoad) => {
    if (nicoAd.versions.case === "v0") {
      const { latest, ranking } = nicoAd.versions.value;
      if (!latest) {
        return;
      }
      const rankingMessage = ranking == null ? "" : `広告貢献${ranking}位`;
      const message = latest.message !== undefined ? latest.message : "";
      this.emit("message", {
        type: "comment",
        label: "bot",
        content: `${rankingMessage} ${latest.advertiser}さんが${latest.point}ポイントニコニ広告しました。「${message}」`,
      } as CommentMessage);
    } else if (nicoAd.versions.case === "v1") {
      this.emit("message", {
        type: "comment",
        label: "bot",
        content: nicoAd.versions.value.message,
      } as CommentMessage);
    } else {
      this.emit("message", {
        type: "comment",
        label: "bot",
        content: "ニコニ広告されました",
      } as CommentMessage);
    }
  };

  private _parseStreamId(responseJson: unknown): string | null {
    if (!this._isProgramsListResponse(responseJson)) {
      throw new Error("Invalid response format");
    }
    if (responseJson.data.programsList.length === 0) {
      throw new Error("programsList is empty");
    }
    for (const item of responseJson.data.programsList) {
      const status = item.program?.schedule?.status;
      if (status === "ON_AIR") {
        const streamId = responseJson.data.programsList[0]?.id?.value;
        if (!streamId) {
          throw new Error("streamId not found in response");
        }
        return streamId;
      }
    }
    return null;
  }

  private _isProgramsListResponse(
    responseJson: unknown,
  ): responseJson is ProgramsListResponse {
    return (
      typeof responseJson === "object" &&
      responseJson !== null &&
      typeof (responseJson as any).data === "object" &&
      (responseJson as any).data !== null &&
      Array.isArray((responseJson as any).data.programsList)
    );
  }
}

type ProgramsListResponse = {
  data: {
    programsList: Array<{
      id?: { value?: string };
      program?: { schedule?: { status?: string } };
    }>;
  };
};
//export const streamInfo = new StreamInfo("98746932");
