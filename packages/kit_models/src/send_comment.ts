export interface SendCommentMessage {
  type: "sendComment";
  site: "youtube" | "niconico";
  content: string;
}
