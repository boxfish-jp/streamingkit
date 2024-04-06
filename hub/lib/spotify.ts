import { exec } from "child_process";

const spotify = async (url: string) => {
  const urlobj = new URL(url);
  const path = urlobj.pathname.split("/");
  if (path.length !== 4 || path[1] !== "intl-ja") {
    return "urlが正しくありません";
  }
  if (path[2] == "playlist") {
    return "playlistは未対応です";
  }
  if (path[2] == "track") {
    let result: string;
    try {
      result = await new Promise((resolve, reject) => {
        exec(
          `spt play -q -u spotify:track:${path[3]} -t`,
          { cwd: "./lib" },
          (err, stdout, stderr) => {
            if (err || (!stdout && !stderr)) {
              resolve("URLが正しくないかも");
            }
            resolve(stdout);
          }
        );
      });
    } catch (e) {
      result = "URLが正しくないかも";
    }
    return result;
  } else {
    return "urlが正しくないよ";
  }
};
export default spotify;
