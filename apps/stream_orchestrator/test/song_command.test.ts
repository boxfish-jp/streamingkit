import type { CommentMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import { songCommand } from "../src/command/commands.js";

describe("songCommand", () => {
  test("「。曲」と完全一致したコメントで現在再生中曲の取得命令を返す", () => {
    const message = {
      type: "comment",
      content: "。曲",
    } as CommentMessage;
    expect(songCommand.isTarget(message)).toBe(true);
    expect(songCommand.action(message)).toStrictEqual([
      {
        type: "spotify",
        content: {
          instruction: "getCurrentTrack",
        },
      },
    ]);
  });

  test("「。曲」コマンドは音声合成しない", () => {
    const message = {
      type: "comment",
      content: "。曲",
    } as CommentMessage;
    expect(songCommand.synthesize(message)).toBeUndefined();
  });

  test("「曲」だけではマッチしない", () => {
    const message = {
      type: "comment",
      content: "曲",
    } as CommentMessage;
    expect(songCommand.isTarget(message)).toBe(false);
  });

  test("「。曲」を含んでも完全一致でなければマッチしない", () => {
    const messages = ["。曲です", "ima 。曲", "。曲かかってる？"];
    for (const content of messages) {
      expect(
        songCommand.isTarget({ type: "comment", content } as CommentMessage),
      ).toBe(false);
    }
  });
});
