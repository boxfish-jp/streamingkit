import type { CommentMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import { getVideoCommands } from "../src/command/video_command.js";

describe("video commands", async () => {
  const commands = await getVideoCommands();
  test("登録されていないコマンドだったらなにもしない", () => {
    const message = {
      type: "comment",
      content: "URL",
    } as CommentMessage;
    for (const command of commands) {
      expect(command.isTarget(message)).toBe(false);
    }
  });

  test("登録されているコマンドが含まれていても、先頭じゃなかったらなにもしない", () => {
    const message = {
      type: "comment",
      content: "これは野菜？",
    } as CommentMessage;
    for (const command of commands) {
      expect(command.isTarget(message)).toBe(false);
    }
  });

  test("登録されている動画コマンドの文字だけのコメントだったら、動画指示を出して、音声合成指示は出さない", () => {
    const message = {
      type: "comment",
      content: "野菜",
    } as CommentMessage;
    for (const command of commands) {
      if (command.isTarget(message)) {
        const synthesizeMessage = command.synthesize(message);
        expect(synthesizeMessage).toBeUndefined();
        const commandMessages = command.action(message);
        expect(commandMessages.length).toBe(1);
        expect(commandMessages[0]).toStrictEqual({
          type: "video",
          name: "野菜",
        });
        return;
      }
    }
  });
  test("登録されている動画コマンドの文字を一部含むコメントだったら、動画指示も出して、音声合成指示も出す", () => {
    const message = {
      type: "comment",
      content: "野菜は美味しいから食べるの",
    } as CommentMessage;
    for (const command of commands) {
      if (command.isTarget(message)) {
        const synthesizeMessage = command.synthesize(message);
        expect(synthesizeMessage).toStrictEqual({
          type: "instSynthesize",
          tag: "comment",
          content: "野菜は美味しいから食べるの",
        });
        const commandMessages = command.action(message);
        expect(commandMessages.length).toBe(1);
        expect(commandMessages[0]).toStrictEqual({
          type: "video",
          name: "野菜",
        });
        return;
      }
    }
  });
});
