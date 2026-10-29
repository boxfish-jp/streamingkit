import { afterEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  watchFile: vi.fn(),
  readUtf8File: vi.fn(),
}));

vi.mock("watch_file", () => ({ watchFile: mocks.watchFile }));
vi.mock("read_file", () => ({ readUtf8File: mocks.readUtf8File }));

import { WatchOrgFiles } from "../src/watch_org_files.js";

type ChangeEvent = "change" | "add" | "unlink";

const createFakeWatcher = (files: string[]) => {
  let onChange: ((event: ChangeEvent, path: string) => void) | null = null;
  const remove = vi.fn(async () => {});
  return {
    watcher: {
      files,
      on: (callback: (event: ChangeEvent, path: string) => void) => {
        onChange = callback;
      },
      remove,
    },
    remove,
    emit: (event: ChangeEvent, path: string) => {
      onChange?.(event, path);
    },
  };
};

const flushPromises = async () => {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
};

describe("WatchOrgFiles", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("初期ファイルを読み込み、変更をold/newで通知する", async () => {
    mocks.readUtf8File.mockResolvedValue("old");
    const fake = createFakeWatcher(["/tmp/a.org"]);
    mocks.watchFile.mockResolvedValue(fake.watcher);
    const watcher = new WatchOrgFiles("/tmp");
    const changes: Array<[string, string]> = [];
    watcher.on("onChange", (oldFile, newFile) => {
      changes.push([oldFile, newFile]);
    });

    await watcher.ready;
    mocks.readUtf8File.mockResolvedValue("new");
    fake.emit("change", "/tmp/a.org");
    await flushPromises();

    expect(mocks.watchFile).toHaveBeenCalledWith("/tmp", ".org");
    expect(changes).toEqual([["old", "new"]]);
    await watcher.dispose();
  });

  test("unlinkでは変更を通知しない", async () => {
    mocks.readUtf8File.mockResolvedValue("content");
    const fake = createFakeWatcher(["/tmp/a.org"]);
    mocks.watchFile.mockResolvedValue(fake.watcher);
    const watcher = new WatchOrgFiles("/tmp");
    const onChange = vi.fn();
    watcher.on("onChange", onChange);
    await watcher.ready;

    fake.emit("unlink", "/tmp/a.org");
    await flushPromises();

    expect(onChange).not.toHaveBeenCalled();
    await watcher.dispose();
  });

  test("読み込みに失敗した場合は変更を通知しない", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.readUtf8File
      .mockResolvedValueOnce("old")
      .mockRejectedValueOnce(new Error("failed"));
    const fake = createFakeWatcher(["/tmp/a.org"]);
    mocks.watchFile.mockResolvedValue(fake.watcher);
    const watcher = new WatchOrgFiles("/tmp");
    const onChange = vi.fn();
    watcher.on("onChange", onChange);
    await watcher.ready;

    fake.emit("change", "/tmp/a.org");
    await flushPromises();

    expect(onChange).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    await watcher.dispose();
  });

  test("監視の開始に失敗するとreadyがrejectする", async () => {
    mocks.watchFile.mockRejectedValue(new Error("failed"));
    const watcher = new WatchOrgFiles("/tmp");

    await expect(watcher.ready).rejects.toThrow("failed");
  });

  test("初期化前にdisposeするとwatcherを破棄する", async () => {
    let resolveWatch = () => {};
    let fake: ReturnType<typeof createFakeWatcher> | null = null;
    mocks.watchFile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWatch = () => {
            const created = createFakeWatcher([]);
            fake = created;
            resolve(created.watcher);
          };
        }),
    );
    const watcher = new WatchOrgFiles("/tmp");

    const disposing = watcher.dispose();
    resolveWatch();
    await disposing;
    await watcher.ready;

    expect(fake?.remove).toHaveBeenCalled();
  });
});
