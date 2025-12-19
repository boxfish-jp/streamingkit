import type { CommentMessage } from "kit_models";
import { describe, expect, test } from "vitest";
import { getEducationCommands } from "../src/command/education.js";

describe("education commands", () => {
  const commands = getEducationCommands();
  test("教育コマンドは「教育:」と「忘却:」の計2つ", () => {
    expect(commands.length).toBe(2);
  });

  test("登録されていないコマンドだったらなにもしない", () => {
    const message = {
      type: "comment",
      content: "こんにちは",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「教育:」と完全一致しなければ何もしない", () => {
    const message = {
      type: "comment",
      content: "教育だね",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「忘却:」と完全一致しなければ何もしない", () => {
    const message = {
      type: "comment",
      content: "忘却せよ",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「教育:」から始まるコメントだった場合、教育コマンドと認識する", () => {
    const message = {
      type: "comment",
      content: "教育:",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(true);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「忘却:」から始まるコメントだった場合、忘却コマンドと認識する", () => {
    const message = {
      type: "comment",
      content: "忘却:",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(true);
  });

  test("「教育:」から始まっていてもコロンが一つしかない場合は、不正なコマンドとみなした音声合成メッセージを出す", () => {
    const message = {
      type: "comment",
      content: "教育:教育して",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(true);
    expect(commands[0].synthesize(message)).toStrictEqual({
      type: "instSynthesize",
      content: "教育コマンドの形式が間違っています",
      tag: "comment",
    });
    expect(commands[0].action(message)).toStrictEqual([]);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「教育:」から始まっていてもコロンが3つ以上ある場合は、不正なコマンドとみなした音声合成メッセージを出す", () => {
    const message = {
      type: "comment",
      content: "教育:ふぐお:天才:バカ",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(true);
    expect(commands[0].synthesize(message)).toStrictEqual({
      type: "instSynthesize",
      content: "教育コマンドの形式が間違っています",
      tag: "comment",
    });
    expect(commands[0].action(message)).toStrictEqual([]);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("「忘却:」から始まっていてもコロンが2つ以上ある場合は、不正なコマンドとみなした音声合成メッセージを出す", () => {
    const message = {
      type: "comment",
      content: "忘却:ふぐお:天才",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(true);
    expect(commands[1].synthesize(message)).toStrictEqual({
      type: "instSynthesize",
      content: "忘却コマンドの形式が間違っています",
      tag: "comment",
    });
    expect(commands[1].action(message)).toStrictEqual([]);
  });

  test("正しい教育コマンドの場合、覚えたことを知らせる音声合成指示と、addEducationメッセージを出す", () => {
    const message = {
      type: "comment",
      content: "教育:ふぐお:天才",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(true);
    expect(commands[0].synthesize(message)).toStrictEqual({
      type: "instSynthesize",
      content: "ふぐおは天才と覚えました",
      tag: "comment",
    });
    expect(commands[0].action(message)).toStrictEqual([
      {
        type: "addEducation",
        key: "ふぐお",
        value: "天才",
      },
    ]);
    expect(commands[1].isTarget(message)).toBe(false);
  });

  test("正しい忘却コマンドの場合、忘却したことを知らせる音声合成指示と、removeEducaiotnメッセージを出す", () => {
    const message = {
      type: "comment",
      content: "忘却:ふぐお",
    } as CommentMessage;
    expect(commands[0].isTarget(message)).toBe(false);
    expect(commands[1].isTarget(message)).toBe(true);
    expect(commands[1].synthesize(message)).toStrictEqual({
      type: "instSynthesize",
      content: "ふぐおを忘れました",
      tag: "comment",
    });
    expect(commands[1].action(message)).toStrictEqual([
      {
        type: "removeEducation",
        key: "ふぐお",
      },
    ]);
  });
});
