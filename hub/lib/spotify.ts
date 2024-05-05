import { exec } from "child_process";

class spotify {
  private comme = "";
  private message = "";

  constructor(comment: string) {
    this.comme = comment;
  }

  private lintPath(path: string[]) {
    for (const p of path) {
      if (p == "playlist") {
        this.message = "playlistは未対応です";
        return false;
      }
      if (p == "track") {
        return true;
      }
    }
    this.message = "urlが正しくないよ";
    return false;
  }

  private parseURI() {
    const urlobj = new URL(this.comme);
    const path = urlobj.pathname.split("/");
    if (this.lintPath(path)) {
      const trackIndex = path.indexOf("track") + 1;

      if (trackIndex !== 0 && trackIndex < path.length) {
        return path[trackIndex];
      }
    }
    return undefined;
  }

  private async sendSpotifyCLI(uri: boolean, word: string, errorMess: string) {
    let command = "";
    if (uri) {
      command = `spt play -q -u spotify:track:${word} -t`;
    } else {
      command = `spt play -q -n ${word} -t`;
    }
    let result = "";
    try {
      result = await new Promise((resolve, reject) => {
        exec(command, { cwd: "./hub/lib" }, (err, stdout, stderr) => {
          if (err || (!stdout && !stderr)) {
            resolve(errorMess);
          }
          resolve("キューに追加しました");
        });
      });
    } catch (e) {
      result = errorMess;
    }
    if (result != errorMess) {
      return "キューに追加しました";
    }
    return result;
  }

  public async playFromUrl() {
    const uri = this.parseURI();
    if (!uri) {
      return this.message;
    }
    this.message = await this.sendSpotifyCLI(true, uri, "URLが正しくないかも");
    return this.message;
  }

  public async playFromWord() {
    this.message = await this.sendSpotifyCLI(
      false,
      this.comme,
      "追加できませんでした"
    );
    return this.message;
  }
}

export default spotify;
