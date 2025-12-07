import { describe, expect, test } from "vitest";
import { CommentMessage } from "../src/comment.js";

describe("commentMessage: filter", () => {
  test("変換対象がない文字列はそのまま出力", () => {
    const message: CommentMessage = new CommentMessage("viewer", "hoge");
    expect(message.filteredContent).toBe("hoge");
  });

  test("変換対象(全角数字)は半角数字に変換", () => {
    const message: CommentMessage = new CommentMessage(
      "viewer",
      "１２３４５６７８９０",
    );
    expect(message.filteredContent).toBe("1234567890");
  });

  test("変換対象(大文字アルファベット)は小文字アルファベットに変換", () => {
    const message: CommentMessage = new CommentMessage("viewer", "OMG");
    expect(message.filteredContent).toBe("omg");
  });

  test("変換対象が含まれたURLはそのまま出力", () => {
    const message: CommentMessage = new CommentMessage(
      "viewer",
      "https://www.youtube.com/watch?v=JwWVgGE5b0Q",
    );
    expect(message.filteredContent).toBe(
      "https://www.youtube.com/watch?v=JwWVgGE5b0Q",
    );
  });

  test("複数の変換対象が含まれたURLはそのまま出力", () => {
    const message: CommentMessage = new CommentMessage(
      "viewer",
      "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
    );
    expect(message.filteredContent).toBe(
      "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
    );
  });

  test("URLの中に変換対象(全角アルファベット)とその外に変換対象(全角アルファベット)は、URLはそのままで変換対象は小文字にする。", () => {
    const message: CommentMessage = new CommentMessage(
      "viewer",
      "https://ｚｄｋ.com ｚｄｋ",
    );
    expect(message.filteredContent).toBe("https://ｚｄｋ.com zdk");
  });
});
