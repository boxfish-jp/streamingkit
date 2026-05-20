import type { SendCommentMessage } from "kit_models";

export const sendCommentBothSites = (content: string): SendCommentMessage[] => [
  {
    type: "sendComment",
    site: "niconico",
    content,
  } as SendCommentMessage,
  {
    type: "sendComment",
    site: "youtube",
    content,
  } as SendCommentMessage,
];
