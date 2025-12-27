type CommentLabel = "viewer" | "bot" | "fuguo";

export type OnCommentCallback = (message: CommentMessage) => void;

export interface CommentMessage {
  type: "comment";
  label: CommentLabel;
  username?: string;
  rawUserId?: string;
  hashedUserId?: string;
  content: string;
}
