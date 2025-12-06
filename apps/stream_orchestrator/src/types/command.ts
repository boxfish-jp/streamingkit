import type { CommentMessage } from "./comment.js";
import type { InstSyntesizeMessage } from "./inst_synthesize.js";
import type { Message } from "./message.js";

export interface Command {
  isNeedLowerCase: boolean;
  isTarget(commentMessage: CommentMessage): boolean;
  action(commentMessage: CommentMessage): Message[];
  synthesize(commentMessage: CommentMessage): InstSyntesizeMessage | undefined;
}
