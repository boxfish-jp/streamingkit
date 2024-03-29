import videoCommands from "../lib/videoCommands";

const main = async (comment: string) => {
  if (comment != "" || comment != undefined) {
    const commands = await videoCommands();
    for (let command of commands) {
      if (comment.indexOf(command) !== -1) {
        console.log("command: " + command);
        return;
      }
    }
    if (comment.indexOf("エクスプロージョン") !== -1) {
      const random = Math.floor(Math.random() * 100);
      console.log(random);
      if (random < 25) {
        console.log("command: エクスプロージョン1");
        return;
      } else if (random >= 25 && random < 50) {
        console.log("command: エクスプロージョン2");
        return;
      } else if (random >= 50 && random < 75) {
        console.log("command: エクスプロージョン3");
        return;
      } else {
        console.log("command: エクスプロージョン4");
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
