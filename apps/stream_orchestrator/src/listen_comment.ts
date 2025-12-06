import type {
  Chat,
  NicoliveState,
  SimpleNotification,
  SimpleNotificationV2,
} from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node.js";
import { CommentMessage, type NotifyCommentCallback } from "./types/comment.js";
import type { NotifyError } from "./types/error.js";

export class ListenComment {
  private _stopListen: (() => void) | null = null;
  private _emitCommentCallBacks: Array<NotifyCommentCallback> = [];
  private _onErrorCallbacks: Array<NotifyError> = [];

  registerOnComment(callback: NotifyCommentCallback) {
    this._emitCommentCallBacks.push(callback);
  }

  registerOnError(callback: NotifyError) {
    this._onErrorCallbacks.push(callback);
  }

  removeOnError(callback: NotifyError) {
    this._onErrorCallbacks = this._onErrorCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  removeOnComment(callback: NotifyCommentCallback) {
    this._emitCommentCallBacks = this._emitCommentCallBacks.filter(
      (cb) => cb !== callback,
    );
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
      client.connect();
      this._stopListen = () => {
        try {
          client?.disconnect();
          client = null;
        } catch (error) {
          this._onErrorCallbacks.forEach((cb) => cb(String(error)));
        }
      };
    } catch (error) {
      this._onErrorCallbacks.forEach((cb) => cb(String(error)));
    }
  }

  stop() {
    this._stopListen?.();
  }

  private _onChat(chat: Chat) {
    if (chat.name === "ふぐお") {
      return;
    }
    const newComment = new CommentMessage(
      "viewer",
      chat.content,
      chat.name,
      chat.rawUserId,
      chat.hashedUserId,
    );
    this._emitCommentCallBacks.forEach((cb) => cb(newComment));
  }

  private _onSimpleNotification(notification: SimpleNotification) {
    const content = notification.message.value;
    if (!content) {
      return;
    }
    this._emitCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("bot", content)),
    );
  }

  private _onSimpleNotificationV2(notification: SimpleNotificationV2) {
    const content = notification.message;
    if (!content) {
      return;
    }
    this._emitCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("bot", content)),
    );
  }

  private _onChangeState(state: NicoliveState) {
    const nusiCome = state.marquee?.display?.operatorComment?.content;
    if (!nusiCome) {
      return;
    }
    this._emitCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("fuguo", nusiCome)),
    );
  }
}
