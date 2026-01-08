import type {
  CommentMessage,
  InstSyntesizeMessage,
  SpotifyMessage,
} from "kit_models";
import { describe, expect, test } from "vitest";
import { getSpotifyCommand } from "../src/command/spotify_command.js";

describe("spotify command", () => {
  const command = getSpotifyCommand();

  test("spotifyのurlではなかったら何もしない", () => {
    const message = {
      type: "comment",
      content: "こんにちは",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(false);
  });

  test("URLでもspotifyのurlではなかったら何もしない", () => {
    const message = {
      type: "comment",
      content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(false);
  });

  test("spotifyのurlでもコメントの先頭でなかったら何もしない", () => {
    const message = {
      type: "comment",
      content:
        "これ聞いて https://open.spotify.com/intl-ja/track/4pCEd0zJ7peL2vRHGhPu9N?si=5851a3e71a754422",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(false);
  });

  test("spotifyのurlでも破損したURLだったら、URLが正しくないことをユーザーに教える", () => {
    const message = {
      type: "comment",
      content: "https://open.spotify.com/hoge",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "instSynthesize",
        content: "urlが正しくないよ",
        tag: "other",
      } as InstSyntesizeMessage,
    ]);
  });

  test("spotifyのurlでも破損したURLだったら、URLが正しくないことをユーザーに教える", () => {
    const message = {
      type: "comment",
      content: "https://open.spotify.com/hoge/aaaaaaaaaaaaaaaaaaa",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "instSynthesize",
        content: "urlが正しくないよ",
        tag: "other",
      } as InstSyntesizeMessage,
    ]);
  });

  test("spotifyのurlでもtrackやplaylistという文字列が含まれていなかったら、URLが正しくないことをユーザーに教える", () => {
    const message = {
      type: "comment",
      content:
        "https://open.spotify.com/intl-ja/hoge/4pCEd0zJ7peL2vRHGhPu9N?si=5851a3e71a754422",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "instSynthesize",
        content: "urlが正しくないよ",
        tag: "other",
      } as InstSyntesizeMessage,
    ]);
  });

  test("spotifyのurlでもplaylistという文字列が含まれていたら、playlistは未対応であるとをユーザーに教える", () => {
    const message = {
      type: "comment",
      content:
        "https://open.spotify.com/intl-ja/playlist/4pCEd0zJ7peL2vRHGhPu9N?si=5851a3e71a754422",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "instSynthesize",
        content: "playlistは未対応です",
        tag: "other",
      } as InstSyntesizeMessage,
    ]);
  });

  test("spotifyのurlでもtrackの後が切れていたら、URLが正しくないことをユーザーに教える", () => {
    const message = {
      type: "comment",
      content: "https://open.spotify.com/intl-ja/track/",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "instSynthesize",
        content: "urlが正しくないよ",
        tag: "other",
      } as InstSyntesizeMessage,
    ]);
  });

  test("正しいspotifyのurlだったら、addQueueメッセージを出す", () => {
    const message = {
      type: "comment",
      content: "https://open.spotify.com/intl-ja/track/4pCEd0zJ7peL2vRHGhPu9N",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "spotify",
        content: {
          instruction: "addQueue",
          uri: "4pCEd0zJ7peL2vRHGhPu9N",
        },
      } as SpotifyMessage,
    ]);
  });

  test("クエリパラメータがついた正しいspotifyのurlでも正常にaddQueueメッセージを出す", () => {
    const message = {
      type: "comment",
      content:
        "https://open.spotify.com/intl-ja/track/4pCEd0zJ7peL2vRHGhPu9N?si=5851a3e71a754422",
    } as CommentMessage;
    expect(command.isTarget(message)).toBe(true);
    expect(command.synthesize(message)).toBeUndefined();
    expect(command.action(message)).toStrictEqual([
      {
        type: "spotify",
        content: {
          instruction: "addQueue",
          uri: "4pCEd0zJ7peL2vRHGhPu9N",
        },
      } as SpotifyMessage,
    ]);
  });
});
