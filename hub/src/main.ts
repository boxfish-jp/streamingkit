import videoCommands from "../lib/videoCommands";
import writeCommand from "./writeCommand";

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
    if (comment.startsWith("/emotion")) {
      comment = comment.replace("/emotion", "");
    }
    if (comment.startsWith("教育:")) {
      console.log("command: 教育");
    }
    if (comment.startsWith("忘却:")) {
      console.log("command: 忘却");
    }
    if (comment.indexOf("https://") !== -1) {
      console.log("command: URL");
    }
    console.log(comment);
  }
};
export default main;
