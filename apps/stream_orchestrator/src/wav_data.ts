import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class WavData {
  public _data: Buffer;
  private _filePath: string;

  get data() {
    return this._data;
  }

  constructor(data: Buffer) {
    this._data = data;
    const unixTime = Date.now();
    this._filePath = join(process.cwd(), `${unixTime}.wav`).replaceAll(
      "\\",
      "/",
    );
  }

  async saveFile() {
    writeFileSync(this._filePath, this.data);
    return this._filePath;
  }

  async deleteFile() {
    unlinkSync(this._filePath);
  }
}
