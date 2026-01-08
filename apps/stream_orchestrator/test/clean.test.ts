import { describe, expect, test } from "vitest";
import { applyEducation, normalizeLowerCase } from "../src/clean.js";

describe("normalizeLowerCase:", () => {
  test("変換対象がない文字列はそのまま出力", () => {
    expect(normalizeLowerCase("hoge")).toBe("hoge");
  });

  test("変換対象(全角数字)は半角数字に変換", () => {
    expect(normalizeLowerCase("１２３４５６７８９０")).toBe("1234567890");
  });

  test("変換対象(大文字アルファベット)は小文字アルファベットに変換", () => {
    expect(normalizeLowerCase("OMG")).toBe("omg");
  });

  test("変換対象が含まれたURLはそのまま出力", () => {
    expect(
      normalizeLowerCase("https://www.youtube.com/watch?v=JwWVgGE5b0Q"),
    ).toBe("https://www.youtube.com/watch?v=JwWVgGE5b0Q");
  });

  test("複数の変換対象が含まれたURLはそのまま出力", () => {
    expect(
      normalizeLowerCase(
        "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
      ),
    ).toBe(
      "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
    );
  });

  test("URLの中に変換対象(全角アルファベット)とその外に変換対象(全角アルファベット)は、URLはそのままで変換対象は小文字にする。", () => {
    expect(normalizeLowerCase("https://ｚｄｋ.com ｚｄｋ")).toBe(
      "https://ｚｄｋ.com zdk",
    );
  });
});

describe("applyEducation:", () => {
  test("「好きなものリストに登録しました」が文末だったら空文字列を返す", () => {
    expect(
      applyEducation("ふとももを一人が好きなものリストに登録しました", []),
    ).toBe("");
  });

  test("「好きなものリストに登録しました」が文末ではない場合は置換しない", () => {
    expect(
      applyEducation("ふとももを一人が好きなものリストに登録しましたか？", []),
    ).toBe("ふとももを一人が好きなものリストに登録しましたか？");
  });

  test("URLをURL省略に置換する", () => {
    expect(
      applyEducation("https://www.youtube.com/watch?v=JwWVgGE5b0Q", []),
    ).toBe("URL省略");
  });

  test("複数のURLをURLの数だけURL省略に置換する", () => {
    expect(
      applyEducation(
        "https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q https://www.youtube.com/watch?v=JwWVgGE5b0Q",
        [],
      ),
    ).toBe("URL省略 URL省略 URL省略");
  });

  test("特殊文字が含まれるURLをURL省略に置換する", () => {
    expect(applyEducation("https://www.ふぐお.com/", [])).toBe("URL省略");
  });

  test("URLとテキストが混在する場合、URLのみURL省略に置換する", () => {
    expect(
      applyEducation(
        "https://www.youtube.com/watch?v=JwWVgGE5b0Q これ作画すごい",
        [],
      ),
    ).toBe("URL省略 これ作画すごい");
  });

  test("教育設定に基づいて文字列を置換する", () => {
    expect(applyEducation("教育死刑", [{ key: "教育", value: "死刑" }])).toBe(
      "死刑死刑",
    );
  });

  test("教育設定に基づいて文字列を複数箇所置換する", () => {
    expect(
      applyEducation("教育教育死刑死刑教育教育", [
        { key: "教育", value: "死刑" },
      ]),
    ).toBe("死刑死刑死刑死刑死刑死刑");
  });

  test("複数の教育設定に基づいて文字列を複数箇所置換する", () => {
    expect(
      applyEducation("教育教育死刑死刑教育教育", [
        { key: "育", value: "教" },
        { key: "死", value: "教" },
        { key: "刑", value: "教" },
      ]),
    ).toBe("教教教教教教教教教教教教");
  });

  test("wが4つ以上連続する場合、wwwに置換する", () => {
    expect(applyEducation("wwwwwwwwwww", [])).toBe("www");
    expect(applyEducation("www", [])).toBe("www");
    expect(applyEducation("ww", [])).toBe("ww");
  });

  test("8が4つ以上連続する場合、何も出力しない(動画コマンドにあるので)", () => {
    expect(applyEducation("8888888888", [])).toBe("");
    expect(applyEducation("888", [])).toBe("888");
    expect(applyEducation("88", [])).toBe("88");
  });

  test("８が4つ以上連続する場合、何も出力しない(動画コマンドにあるので)", () => {
    expect(applyEducation("８８８８８８８８８", [])).toBe("");
    expect(applyEducation("８８８", [])).toBe("８８８");
    expect(applyEducation("８８", [])).toBe("８８");
  });

  test("あが4つ以上連続する場合、あああに置換する", () => {
    expect(applyEducation("ああああああああ", [])).toBe("あああ");
    expect(applyEducation("あああ", [])).toBe("あああ");
    expect(applyEducation("ああ", [])).toBe("ああ");
  });

  test("ぁが4つ以上連続する場合、ぁぁぁに置換する", () => {
    expect(applyEducation("ぁぁぁぁぁぁぁぁ", [])).toBe("ぁぁぁ");
    expect(applyEducation("ぁぁぁ", [])).toBe("ぁぁぁ");
    expect(applyEducation("ぁぁ", [])).toBe("ぁぁ");
  });
});
