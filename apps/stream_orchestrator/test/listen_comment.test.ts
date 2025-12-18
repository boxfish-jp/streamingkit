import type { ErrorMessage } from "kit_models";
import { expect, test } from "vitest";
import { ListenComment } from "../src/listen_comment.js";

test("listenComent: invalid Id", async () => {
  const listenComment = new ListenComment();
  const callback = (errorMessage: ErrorMessage) => {
    expect(errorMessage.message).toBe(
      'SyntaxError: "undefined" is not valid JSON',
    );
  };
  listenComment.on("error", callback);
  listenComment.start("0");
  // 200ms待つ
  await new Promise((resolve) => setTimeout(resolve, 200));
});
