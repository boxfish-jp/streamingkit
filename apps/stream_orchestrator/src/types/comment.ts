type CommentLabel = "viewer" | "bot" | "fuguo";

export type NotifyCommentCallback = (message: CommentMessage) => void;

export class CommentMessage {
  readonly type = "comment";
  readonly label: CommentLabel;
  readonly username?: string;
  readonly rawUserId?: bigint;
  readonly hashedUserId?: string;
  readonly content: string;
  speekText: string;

  constructor(
    label: CommentLabel,
    content: string,
    username?: string,
    rawUserId?: bigint,
    hashedUserId?: string,
  ) {
    this.label = label;
    this.content = content;
    this.speekText = content;
    this.username = username;
    this.rawUserId = rawUserId;
    this.hashedUserId = hashedUserId;
  }
}
