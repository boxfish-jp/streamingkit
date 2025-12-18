import { EventEmitter } from "node:events";
import type {
  Chat,
  NicoliveState,
  SimpleNotification,
  SimpleNotificationV2,
} from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node.js";
import { CommentMessage, type ErrorMessage } from "kit_models";

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
        .on("changeState", this._onChangeState);
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
    this.emit(
      "comment",
      new CommentMessage(
        "viewer",
        chat.content,
        chat.name,
        chat.rawUserId,
        chat.hashedUserId,
      ),
    );
  }

  private _onSimpleNotification(notification: SimpleNotification) {
    const content = notification.message.value;
    if (!content) {
      return;
    }
    this.emit("comment", new CommentMessage("bot", content));
  }

  private _onSimpleNotificationV2(notification: SimpleNotificationV2) {
    const content = notification.message;
    if (!content) {
      return;
    }
    this.emit("comment", new CommentMessage("bot", content));
  }

  private _onChangeState(state: NicoliveState) {
    const nusiCome = state.marquee?.display?.operatorComment?.content;
    if (!nusiCome) {
      return;
    }
    this.emit("comment", new CommentMessage("fuguo", nusiCome));
  }
}
