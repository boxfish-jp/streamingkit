import { describe, expect, test } from "vitest";
import { clean } from "../src/clean.js";

describe("clean:", () => {
  test("「好きなものリストに登録しました」が文末だったら空文字列を返す", () => {
    expect(clean("ふとももを一人が好きなものリストに登録しました", [])).toBe(
      "",
    );
  });

  test("「好きなものリストに登録しました」が文末ではない場合は置換しない", () => {
    expect(
      clean("ふとももを一人が好きなものリストに登録しましたか？", []),
    ).toBe("ふとももを一人が好きなものリストに登録しましたか？");
  });

  test("URLをURL省略に置換する", () => {
    expect(clean("https://www.youtube.com/watch?v=JwWVgGE5b0Q", [])).toBe(
      "URL省略",
    );
  });

  test("複数のURLをURLの数だけURL省略に置換する", () => {
    expect(
      clean(
        "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
        [],
      ),
    ).toBe("URL省略 URL省略 URL省略");
  });

  test("特殊文字が含まれるURLをURL省略に置換する", () => {
    expect(clean("https://www.ふぐお.com/", [])).toBe("URL省略");
  });

  test("URLとテキストが混在する場合、URLのみURL省略に置換する", () => {
    expect(
      clean("https://www.youtube.com/watch?v=JwWVgGE5b0Q これ作画すごい", []),
    ).toBe("URL省略 これ作画すごい");
  });

  test("教育設定に基づいて文字列を置換する", () => {
    expect(clean("教育死刑", [{ key: "教育", value: "死刑" }])).toBe(
      "死刑死刑",
    );
  });

  test("教育設定に基づいて文字列を複数箇所置換する", () => {
    expect(
      clean("教育教育死刑死刑教育教育", [{ key: "教育", value: "死刑" }]),
    ).toBe("死刑死刑死刑死刑死刑死刑");
  });

  test("複数の教育設定に基づいて文字列を複数箇所置換する", () => {
    expect(
      clean("教育教育死刑死刑教育教育", [
        { key: "育", value: "教" },
        { key: "死", value: "教" },
        { key: "刑", value: "教" },
      ]),
    ).toBe("教教教教教教教教教教教教");
  });
});
