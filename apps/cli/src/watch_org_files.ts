import { EventEmitter } from "event_emitter";
import { readUtf8File } from "read_file";
import { watchFile } from "watch_file";

interface WatchOrgFilesEvent {
  onChange: [oldFile: string, newFile: string];
}

type Watcher = Awaited<ReturnType<typeof watchFile>>;

const LOG_PREFIX = "org";

export class WatchOrgFiles extends EventEmitter<WatchOrgFilesEvent> {
  private _files = new Map<string, string>();
  private _watcher: Watcher | null = null;
  private _ready: Promise<void>;
  private _disposed = false;

  constructor(targetDirectory: string) {
    super();
    this._ready = this._start(targetDirectory);
  }

  get ready() {
    return this._ready;
  }

  async dispose() {
    this._disposed = true;
    const watcher = this._watcher;
    this._watcher = null;
    this._files.clear();
    await watcher?.remove();
  }

  private _start = async (targetDirectory: string) => {
    const watcher = await watchFile(targetDirectory, ".org");
    if (this._disposed) {
      await watcher.remove();
      return;
    }
    this._watcher = watcher;
    watcher.on((event, path) => {
      void this._onChange(event, path).catch((error) => {
        console.error(`${LOG_PREFIX}: 変更の処理に失敗しました`, error);
      });
    });
    await Promise.all(watcher.files.map((path) => this._setFile(path)));
  };

  private _onChange = async (
    event: "change" | "add" | "unlink",
    path: string,
  ) => {
    if (this._disposed) return;
    if (event === "unlink") {
      this._files.delete(path);
      return;
    }
    const oldData = this._files.get(path) ?? "";
    if (!(await this._setFile(path))) return;
    if (this._disposed) return;
    this.emit("onChange", oldData, this._files.get(path) ?? "");
  };

  private _setFile = async (path: string) => {
    if (this._disposed) return false;
    try {
      this._files.set(path, await readUtf8File(path));
      return true;
    } catch (error) {
      console.error(`${LOG_PREFIX}: "${path}" の読み込みに失敗しました`, error);
      return false;
    }
  };
}
