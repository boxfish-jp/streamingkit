import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promiseWithResolvers } from "promise_with_resolvers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { watchFile } from "../src/index.js";

describe("watchFile:", async () => {
  let tmpDirPath = "";
  let watcher: Awaited<ReturnType<typeof watchFile>>;

  test("ファイルが追加されたときに検知する", async () => {
    watcher = await watchFile(tmpDirPath, "txt");
    const { promise, resolve } = promiseWithResolvers<void>();
    const filePath = join(tmpDirPath, "test.txt");
    watcher.on((event, path) => {
      expect(event).toBe("add");
      expect(path).toBe(filePath);
      resolve();
    });
    await writeFile(filePath, "");
    return promise;
  });

  test("ファイルの検知はディレクトリ内を再帰的に探索する", async () => {
    watcher = await watchFile(tmpDirPath, "txt");
    const { promise, resolve } = promiseWithResolvers<void>();
    const targetPath = join(tmpDirPath, "subdir");
    const filePath = join(targetPath, "test.txt");
    watcher.on((event, path) => {
      expect(event).toBe("add");
      expect(path).toBe(filePath);
      resolve();
    });
    await mkdir(targetPath);
    writeFile(join(targetPath, "test.txt"), "");
    return promise;
  });

  test("拡張子が異なるファイルの場合は検知しない", async () => {
    watcher = await watchFile(tmpDirPath, "txtt");
    const { promise, resolve, reject } = promiseWithResolvers<void>();
    const filePath = join(tmpDirPath, "test.txt");
    watcher.on(() => {
      reject("呼び出されては行けない");
    });
    await writeFile(filePath, "");
    setTimeout(() => {
      resolve();
    }, 100);
    return promise;
  });

  test("ファイルの追加を検知する", async () => {
    watcher = await watchFile(tmpDirPath, "txt");
    const { promise, resolve } = promiseWithResolvers<void>();
    const filePath = join(tmpDirPath, "test.txt");
    watcher.on((event, path) => {
      expect(event).toBe("add");
      expect(path).toBe(filePath);
      resolve();
    });
    await writeFile(filePath, "");
    return promise;
  });

  test("ファイルの更新を検知する(atomic rename)", async () => {
    const filePath = join(tmpDirPath, "test.txt");
    await writeFile(filePath, "");
    watcher = await watchFile(tmpDirPath, "txt");
    const { promise, resolve } = promiseWithResolvers<void>();
    watcher.on((event, path) => {
      expect(event).toBe("change");
      expect(path).toBe(filePath);
      resolve();
    });
    await writeFile(filePath, "update");
    return promise;
  });

  test("ファイルの削除を検知する", async () => {
    const filePath = join(tmpDirPath, "test.txt");
    await writeFile(filePath, "");
    watcher = await watchFile(tmpDirPath, "txt");
    const { promise, resolve } = promiseWithResolvers<void>();
    watcher.on((event, path) => {
      expect(event).toBe("unlink");
      expect(path).toBe(filePath);
      resolve();
    });
    await rm(filePath);
    return promise;
  });

  beforeEach(async () => {
    tmpDirPath = await mkdtemp(join(tmpdir(), "test-"));
  });

  afterEach(async () => {
    watcher.remove();
    await rm(tmpDirPath, { recursive: true, force: true });
  });
});
