import videoCommands from "../lib/videoCommands";
import writeCommand from "../lib/writeCommand";
import { eduRegist, eduRemove, filterComment } from "../lib/education";
import { spotifyUrl, spotifyWord } from "../lib/spotify";

const command = async (comment: string) => {
  if (comment != "" || comment != undefined) {
    const commands = await videoCommands();
    for (let command of commands) {
      if (comment.indexOf(command) !== -1) {
        if (comment.indexOf("エクスプロージョン") !== -1) {
          const random = Math.floor(Math.random() * 100);
          if (random < 25) {
            await writeCommand("エクスプロージョン1");
            return "";
          } else if (random >= 25 && random < 50) {
            await writeCommand("エクスプロージョン2");
            return "";
          } else if (random >= 50 && random < 75) {
            await writeCommand("エクスプロージョン3");
            return "";
          } else {
            await writeCommand("エクスプロージョン4");
            return "";
          }
        } else {
          await writeCommand(command);
          return comment.length > command.length ? comment : "";
        }
      }
    }
    if (comment.startsWith("教育:")) {
      const edu = comment.split(":");
      if (edu.length !== 3) {
        return "教育コマンドの形式が間違っています";
      }
      await eduRegist(edu[1], edu[2]);
      return `${edu[1]}は${edu[2]}と覚えました`;
    }
    if (comment.startsWith("忘却:")) {
      const edu = comment.split(":");
      if (edu.length !== 2) {
        return "忘却コマンドの形式が間違っています";
      }
      await eduRemove(edu[1]);
      return `${edu[1]}を忘れました`;
    }
    if (comment.indexOf("https://open.spotify.com/") !== -1) {
      return await spotifyUrl(comment);
    }
    if (comment.startsWith("spo:")) {
      const word = comment.replace("spo:", "");
      return await spotifyWord(word);
    }
    comment = await filterComment(comment);
    return comment;
  }
  return "";
};
export default command;
