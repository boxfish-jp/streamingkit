import type {
  Chat,
  NicoliveState,
  SimpleNotification,
  SimpleNotificationV2,
} from "@kikurage/nicolive-api";
import { NicoliveClient } from "@kikurage/nicolive-api/node.js";
import {
  CommentMessage,
  type NotifyError,
  type OnCommentCallback,
} from "kit_models";

export class ListenComment {
  private _stopListen: (() => void) | null = null;
  private _onCommentCallBacks: Array<OnCommentCallback> = [];
  private _onErrorCallbacks: Array<NotifyError> = [];

  constructor() {
    this._onChat = this._onChat.bind(this);
    this._onSimpleNotification = this._onSimpleNotification.bind(this);
    this._onSimpleNotificationV2 = this._onSimpleNotificationV2.bind(this);
    this._onChangeState = this._onChangeState.bind(this);
  }

  registerOnComment(callback: OnCommentCallback) {
    this._onCommentCallBacks.push(callback);
  }

  registerOnError(callback: NotifyError) {
    this._onErrorCallbacks.push(callback);
  }

  removeOnError(callback: NotifyError) {
    this._onErrorCallbacks = this._onErrorCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  removeOnComment(callback: OnCommentCallback) {
    this._onCommentCallBacks = this._onCommentCallBacks.filter(
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
      await client.connect();
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
    this._onCommentCallBacks.forEach((cb) => cb(newComment));
  }

  private _onSimpleNotification(notification: SimpleNotification) {
    const content = notification.message.value;
    if (!content) {
      return;
    }
    this._onCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("bot", content)),
    );
  }

  private _onSimpleNotificationV2(notification: SimpleNotificationV2) {
    const content = notification.message;
    if (!content) {
      return;
    }
    this._onCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("bot", content)),
    );
  }

  private _onChangeState(state: NicoliveState) {
    const nusiCome = state.marquee?.display?.operatorComment?.content;
    if (!nusiCome) {
      return;
    }
    this._onCommentCallBacks.forEach((cb) =>
      cb(new CommentMessage("fuguo", nusiCome)),
    );
  }
}
