import { urlRegex } from "../url_regex.js";

type CommentLabel = "viewer" | "bot" | "fuguo";

export type NotifyCommentCallback = (message: CommentMessage) => void;

export class CommentMessage {
  readonly type = "comment";
  readonly label: CommentLabel;
  readonly username?: string;
  readonly rawUserId?: bigint;
  readonly hashedUserId?: string;
  readonly content: string;

  constructor(
    label: CommentLabel,
    content: string,
    username?: string,
    rawUserId?: bigint,
    hashedUserId?: string,
  ) {
    this.label = label;
    this.content = content;
    this.username = username;
    this.rawUserId = rawUserId;
    this.hashedUserId = hashedUserId;
  }

  get filteredContent(): string {
    const textParts = this.content.split(urlRegex);
    const urlParts = this.content.match(urlRegex);

    let text = "";
    for (const part of textParts) {
      if (part === undefined) {
        text += urlParts?.shift() ?? "";
      } else if (part) {
        text += part
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
            String.fromCharCode(char.charCodeAt(0) - 0xfee0),
          )
          .replace(/[A-Za-z]/g, (char) => char.toLowerCase());
      }
    }
    return text;
  }
}
