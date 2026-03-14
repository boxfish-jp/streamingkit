import { EventEmitter } from "event_emitter";
import { readUtf8File } from "read_file";
import { watchFile } from "watch_file";

interface WatchOrgFilesEvent {
  onChange: [oldFile: string, newFile: string];
}

export class WatchOrgFiles extends EventEmitter<WatchOrgFilesEvent> {
  private _files: Map<string, string>;
  private _targetDirectory: string;
  //private _removeListener = () => {};

  constructor(targetDirectory: string) {
    super();
    this._files = new Map();
    this._targetDirectory = targetDirectory;
    this._init();
  }

  private _init = async () => {
    const watcher = await watchFile(this._targetDirectory, ".org");
    watcher.on((event, path) => {
      this._onChange(event, path);
    });
    //this._removeListener = watcher.remove;
    for (const path of watcher.files) {
      this._setFile(path);
    }
  };

  private _onChange = async (
    event: "change" | "add" | "unlink",
    path: string,
  ) => {
    const oldData = this._files.get(path) ?? "";
    switch (event) {
      case "add":
      case "change":
        await this._setFile(path);
        break;
      case "unlink":
        this._files.delete(path);
        return;
    }
    const newData = this._files.get(path) ?? "";
    this.emit("onChange", oldData, newData);
  };

  private _setFile = async (path: string) => {
    if (path.endsWith(".org")) {
      const data = await readUtf8File(path);
      this._files.set(path, data);
    }
  };
}
