import type { ErrorMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import { ListenComment } from "../src/listen_comment.js";

describe("listenComment", () => {
  test("無効な生放送IDを入れると、serverWatchCommentでのエラーが出る", async () => {
    const listenComment = new ListenComment();
    const callback = (errorMessage: ErrorMessage) => {
      expect(errorMessage.status).toBe("serverWatchComment");
    };
    listenComment.on("error", callback);
    listenComment.start("0");
    // 200ms待つ
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
});
