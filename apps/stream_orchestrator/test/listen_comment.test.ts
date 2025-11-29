import { expect, test } from "vitest";
import { ListenComment } from "../src/listen_comment.js";
import type { NotifyError } from "../src/types/error.js";

test("listenComent: invalid Id", async () => {
  const listenComment = new ListenComment();
  const callback: NotifyError = (error) => {
    expect(error).toBe('SyntaxError: "undefined" is not valid JSON');
  };
  listenComment.registerOnError(callback);
  listenComment.start("0");
  // 200ms待つ
  await new Promise((resolve) => setTimeout(resolve, 200));
});
