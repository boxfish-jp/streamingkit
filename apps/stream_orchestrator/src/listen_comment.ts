import { EventEmitter } from "node:events";
import type {
  Chat,
  Gift,
  Nicoad,
  NicoliveState,
  SimpleNotification,
  SimpleNotificationV2,
} from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node.js";
import type { CommentMessage, ErrorMessage } from "kit_models";

interface ListenCommentEvents {
  comment: [message: CommentMessage];
  error: [error: ErrorMessage];
}

export class ListenComment extends EventEmitter<ListenCommentEvents> {
  private _stopListen: (() => void) | null = null;

  constructor() {
    super();
    this._onChat = this._onChat.bind(this);
    this._onSimpleNotification = this._onSimpleNotification.bind(this);
    this._onSimpleNotificationV2 = this._onSimpleNotificationV2.bind(this);
    this._onChangeState = this._onChangeState.bind(this);
  }

  async start(lvid: string) {
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
          this.emit("error", {
            type: "error",
            status: "serverStopComment",
            time: Date.now(),
            message: error,
          } as ErrorMessage);
        }
      };
    } catch (error) {
      this.emit("error", {
        type: "error",
        status: "serverWatchComment",
        time: Date.now(),
        message: error,
      } as ErrorMessage);
    }
  }

  stop() {
    this._stopListen?.();
  }

  private _onChat(chat: Chat) {
    if (chat.name === "ふぐお") {
      return;
    }
    this.emit("comment", {
      type: "comment",
      label: "viewer",
      content: chat.content,
      username: chat.name,
      rawUserId: chat.rawUserId,
      hashedUserId: chat.hashedUserId,
    } as CommentMessage);
  }

  private _onSimpleNotification(notification: SimpleNotification) {
    const content = notification.message.value;
    if (!content) {
      return;
    }
    this.emit("comment", {
      type: "comment",
      label: "bot",
      content: content,
    } as CommentMessage);
  }

  private _onSimpleNotificationV2(notification: SimpleNotificationV2) {
    const content = notification.message;
    if (!content) {
      return;
    }
    this.emit("comment", {
      type: "comment",
      label: "bot",
      content: content,
    } as CommentMessage);
  }

  private _onChangeState(state: NicoliveState) {
    const nusiCome = state.marquee?.display?.operatorComment?.content;
    if (!nusiCome) {
      return;
    }
    this.emit("comment", {
      type: "comment",
      label: "fuguo",
      content: nusiCome,
    } as CommentMessage);
  }

  private _onGift(gift: Gift) {
    const rankingMessage =
      gift.contributionRank == null
        ? ""
        : `ギフト貢献${gift.contributionRank}位`;
    this.emit("comment", {
      type: "comment",
      label: "bot",
      content: `${rankingMessage} ${gift.advertiserName}さんがギフト「${gift.itemName} (${gift.point}pt)」を贈りました。「${gift.message}」`,
    } as CommentMessage);
  }

  private _onNicoAd(nicoAd: Nicoad) {
    if (nicoAd.versions.case === "v0") {
      const { latest, ranking } = nicoAd.versions.value;
      if (!latest) {
        return;
      }
      const rankingMessage = ranking == null ? "" : `広告貢献${ranking}位`;
      const message = latest.message !== undefined ? latest.message : "";
      this.emit("comment", {
        type: "comment",
        label: "bot",
        content: `${rankingMessage} ${latest.advertiser}さんが${latest.point}ポイントニコニ広告しました。「${message}」`,
      } as CommentMessage);
    }
  }
}
