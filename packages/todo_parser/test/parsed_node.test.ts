import { describe, expect, test } from "vitest";
import { parseNodes } from "../src/parsed_node/parser.js";
import { printDocument } from "../src/parsed_node/printer.js";

describe("parseNodes:", () => {
  test("todo.orgの形式の文字列をTask[]に変換できること", () => {
    const originalTestData = `
* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
** DEVELOPING effectページのhubへの配信方法の調査
* プログラミング配信において、現在の進捗を表示する
** DONE パーサーの自作
*** DONE パーサの作り方調べる
*** DONE 足し算引き算パーサで練習
** 要件定義
*** DONE 表示するものを決める
*** THINKING 具体的にどう表示するか決める
* 配信ツールダウンディテクタの構築
** DONE オーケストレーターからメッセージのハブ機能を独立させる
CLOSED: [2026-02-28 Sat 16:41]

** ハブ機能にメッセージ監視機能をつける

** ふぐおAPIの構築(別リポジトリ)

** ふぐおダウンディテクタサイトの制作

* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
CLOSED: [2026-03-01 Sun 17:43]
** DONE websocket周りの調整
CLOSED: [2026-03-01 Sun 18:00]

* プログラミング配信において、現在の進捗を表示する
** 要件定義
*** DONE 表示するものを決めよう
CLOSED: [2026-03-01 Sun 22:55]
*** DONE 表示するものをどうやって取得するかを考えよう
CLOSED: [2026-03-01 Sun 23:02]
*** DONE 具体的にどう実装するか
CLOSED: [2026-03-02 Mon 23:57]
** ファイルの監視
*** DONE chokidarを使ってみる
    CLOSED: [2026-03-03 Tue 15:41]
*** DONE chokidarでディレクトリを見張ることができるか検証
    CLOSED: [2026-03-03 Tue 16:09]
*** DONE CLIプロジェクトの環境構築
    CLOSED: [2026-03-03 Tue 16:40]
*** DONE chokidarを使ってファイル監視の実装
    CLOSED: [2026-03-03 Tue 17:46]
*** CANCELED flockを使ってみる
    CLOSED: [2026-03-03 Tue 18:36]
*** DONE  ファイルの読み取りを行う
    CLOSED: [2026-03-05 Thu 14:40]
*** DONE パッケージ化
    CLOSED: [2026-03-05 Thu 16:29]
** パーサーの自作
*** DONE パーサの作り方調べる
    CLOSED: [2026-03-05 Thu 17:12]
*** DONE 足し算引き算パーサで練習
    CLOSED: [2026-03-05 Thu 22:56]
*** DONE ASTの定義
    CLOSED: [2026-03-05 Thu 23:21]
*** DONE プリンタの作成
    CLOSED: [2026-03-06 Fri 00:02]
*** DEVELOPING パーサの自作
** 変更の検出
** メッセージの送信
** フロントエンド作成
`;
    const cleanedTestData = `
* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
** DEVELOPING effectページのhubへの配信方法の調査
* プログラミング配信において、現在の進捗を表示する
** DONE パーサーの自作
*** DONE パーサの作り方調べる
*** DONE 足し算引き算パーサで練習
** 要件定義
*** DONE 表示するものを決める
*** THINKING 具体的にどう表示するか決める
* 配信ツールダウンディテクタの構築
** DONE オーケストレーターからメッセージのハブ機能を独立させる
** ハブ機能にメッセージ監視機能をつける
** ふぐおAPIの構築(別リポジトリ)
** ふぐおダウンディテクタサイトの制作
* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
** DONE websocket周りの調整
* プログラミング配信において、現在の進捗を表示する
** 要件定義
*** DONE 表示するものを決めよう
*** DONE 表示するものをどうやって取得するかを考えよう
*** DONE 具体的にどう実装するか
** ファイルの監視
*** DONE chokidarを使ってみる
*** DONE chokidarでディレクトリを見張ることができるか検証
*** DONE CLIプロジェクトの環境構築
*** DONE chokidarを使ってファイル監視の実装
*** CANCELED flockを使ってみる
*** DONE ファイルの読み取りを行う
*** DONE パッケージ化
** パーサーの自作
*** DONE パーサの作り方調べる
*** DONE 足し算引き算パーサで練習
*** DONE ASTの定義
*** DONE プリンタの作成
*** DEVELOPING パーサの自作
** 変更の検出
** メッセージの送信
** フロントエンド作成
`.trim();

    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(cleanedTestData);
  });

  test("空の文字列を渡したとき、空の配列が返ってくること", () => {
    const parsed = parseNodes("");
    const printed = printDocument(parsed);
    expect(printed).toEqual("");
  });

  test("改行を含む空の文字列を渡したとき、空の配列が返ってくること", () => {
    const parsed = parseNodes("\n\n\n");
    const printed = printDocument(parsed);
    expect(printed).toEqual("");
  });

  test("要素が1つのときのパース", () => {
    const originalTestData = `* TODO a`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData);
    expect(parsed.get("1")).toEqual({
      id: "1",
      depth: 1,
      title: "a",
      rawTag: "TODO",
      parentId: null,
      status: "TODO",
      childrenIds: [],
      lineIndex: 0,
      path: ["a"],
    });
  });

  test("要素の中にタスクのステータスラベルがない場合はNONEと処理される", () => {
    const originalTestData = `* a`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData);
    expect(parsed.get("1")).toEqual({
      id: "1",
      depth: 1,
      title: "a",
      rawTag: null,
      parentId: null,
      status: "TODO",
      childrenIds: [],
      lineIndex: 0,
      path: ["a"],
    });
  });

  test("兄弟要素のタスクのパース", () => {
    const originalTestData = `
* TODO a
* THINKING b
`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData.trim());
    expect(parsed.get("1")).toEqual({
      id: "1",
      depth: 1,
      title: "a",
      rawTag: "TODO",
      parentId: null,
      status: "TODO",
      childrenIds: [],
      lineIndex: 0,
      path: ["a"],
    });

    expect(parsed.get("2")).toEqual({
      id: "2",
      depth: 1,
      title: "b",
      rawTag: "THINKING",
      parentId: null,
      status: "THINKING",
      childrenIds: [],
      lineIndex: 1,
      path: ["b"],
    });
  });

  test("親子要素のタスクのパース", () => {
    const originalTestData = `
* TODO a
** THINKING b
`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData.trim());
    expect(parsed.get("1")).toEqual({
      id: "1",
      depth: 1,
      title: "a",
      rawTag: "TODO",
      parentId: null,
      status: "TODO",
      childrenIds: ["1-1"],
      lineIndex: 0,
      path: ["a"],
    });

    expect(parsed.get("1-1")).toEqual({
      id: "1-1",
      depth: 2,
      title: "b",
      rawTag: "THINKING",
      parentId: "1",
      status: "THINKING",
      childrenIds: [],
      lineIndex: 1,
      path: ["a", "b"],
    });
  });

  test("孫要素のタスクのパース", () => {
    const originalTestData = `
* TODO a
** THINKING b
*** DEVELOPING b
`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData.trim());
    expect(parsed.get("1")).toEqual({
      id: "1",
      depth: 1,
      title: "a",
      rawTag: "TODO",
      parentId: null,
      status: "TODO",
      childrenIds: ["1-1"],
      lineIndex: 0,
      path: ["a"],
    });
    expect(parsed.get("1-1")).toEqual({
      id: "1-1",
      depth: 2,
      title: "b",
      rawTag: "THINKING",
      parentId: "1",
      status: "THINKING",
      childrenIds: ["1-1-1"],
      lineIndex: 1,
      path: ["a", "b"],
    });
    expect(parsed.get("1-1-1")).toEqual({
      id: "1-1-1",
      depth: 3,
      title: "b",
      rawTag: "DEVELOPING",
      parentId: "1-1",
      status: "DEVELOPING",
      childrenIds: [],
      lineIndex: 2,
      path: ["a", "b", "b"],
    });
  });

  test("2レベル以上のジャンプ", () => {
    const originalTestData = `
* TODO a
** TODO b
*** TODO c
* TODO a
*** c
**** TODO d
** TODO b
`;
    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(originalTestData.trim());
    expect(parsed.get("2-1")).toEqual({
      id: "2-1",
      depth: 3,
      title: "c",
      rawTag: null,
      parentId: "2",
      status: "TODO",
      childrenIds: ["2-1-1"],
      lineIndex: 4,
      path: ["a", "c"],
    });
    expect(parsed.get("2-1-1")).toEqual({
      id: "2-1-1",
      depth: 4,
      title: "d",
      rawTag: "TODO",
      parentId: "2-1",
      status: "TODO",
      childrenIds: [],
      lineIndex: 5,
      path: ["a", "c", "d"],
    });
    expect(parsed.get("2-2")).toEqual({
      id: "2-2",
      depth: 2,
      title: "b",
      rawTag: "TODO",
      parentId: "2",
      status: "TODO",
      childrenIds: [],
      lineIndex: 6,
      path: ["a", "b"],
    });
  });

  test("CLOSEDや改行など他の要素が含まれていたら無視をする", () => {
    const originalTestData = `
* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
CLOSED: [2026-03-01 Sun 17:43]
** DONE websocket周りの調整
CLOSED: [2026-03-01 Sun 18:00]

* プログラミング配信において、現在の進捗を表示する
** 要件定義
*** DONE 表示するものを決めよう
CLOSED: [2026-03-01 Sun 22:55]
*** DONE 表示するものをどうやって取得するかを考えよう
CLOSED: [2026-03-01 Sun 23:02]
*** DONE 具体的にどう実装するか
CLOSED: [2026-03-02 Mon 23:57]
`;
    const cleanedTestData = `
* effectページをhubで配信しよう
** DONE effectページのビルド方法の調査
** DONE websocket周りの調整
* プログラミング配信において、現在の進捗を表示する
** 要件定義
*** DONE 表示するものを決めよう
*** DONE 表示するものをどうやって取得するかを考えよう
*** DONE 具体的にどう実装するか
`.trim();

    const parsed = parseNodes(originalTestData);
    const printed = printDocument(parsed);
    expect(printed).toEqual(cleanedTestData);
  });
});
