import videoCommands from "../lib/videoCommands";
import writeCommand from "../lib/writeCommand";
import { eduRegist, eduRemove } from "../lib/education";

const main = async (comment: string) => {
  if (comment != "" || comment != undefined) {
    const commands = await videoCommands();
    for (let command of commands) {
      if (comment.indexOf(command) !== -1) {
        await writeCommand(command);
        return;
      }
    }
    if (comment.indexOf("エクスプロージョン") !== -1) {
      const random = Math.floor(Math.random() * 100);
      console.log(random);
      if (random < 25) {
        await writeCommand("エクスプロージョン1");
        return;
      } else if (random >= 25 && random < 50) {
        await writeCommand("エクスプロージョン2");
        return;
      } else if (random >= 50 && random < 75) {
        await writeCommand("エクスプロージョン3");
        return;
      } else {
        await writeCommand("エクスプロージョン4");
        return;
      }
    }
    if (comment.startsWith("教育:")) {
      const edu = comment.split(":");
      if (edu.length !== 3) {
        comment = "教育コマンドの形式が間違っています";
      }
      await eduRegist(edu[1], edu[2]);
    }
    if (comment.startsWith("忘却:")) {
      const edu = comment.split(":");
      if (edu.length !== 2) {
        comment = "忘却コマンドの形式が間違っています";
      }
      await eduRemove(edu[1]);
    }
    if (comment.indexOf("https://") !== -1) {
      console.log("command: URL");
    }
    console.log(comment);
  }
};
export default main;
