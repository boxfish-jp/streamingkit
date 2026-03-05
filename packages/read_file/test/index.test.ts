import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { readUtf8File } from "../src/index.js";

describe("readUtf8File:", async () => {
  let tmpDirPath = "";

  test("ファイルを正常に読むことができるか", async () => {
    const filePath = join(tmpDirPath, "test.txt");
    await writeFile(filePath, "Hello, World!");
    const data = await readUtf8File(filePath);
    expect(data).toBe("Hello, World!");
  });

  test("無効なパスを指定した場合", async () => {
    const filePath = join(tmpDirPath, "test.txt");
    expect(async () => await readUtf8File(filePath)).rejects.toThrowError();
  });

  test("ファイルの中身が空だった場合", async () => {
    const filePath = join(tmpDirPath, "test.txt");
    await writeFile(filePath, "");
    const data = await readUtf8File(filePath);
    expect(data).toBe("");
  });

  beforeEach(async () => {
    tmpDirPath = await mkdtemp(join(tmpdir(), "test-"));
  });

  afterEach(async () => {
    await rm(tmpDirPath, { recursive: true, force: true });
  });
});
