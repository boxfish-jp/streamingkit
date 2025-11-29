type CommentLabel = "viewer" | "bot" | "fuguo";

export type NotifyCommentCallback = (comment: Comment) => void;

export class Comment {
  readonly label: CommentLabel;
  readonly username?: string;
  readonly rawUserId?: bigint;
  readonly hashedUserId?: string;
  content: string;

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
}
