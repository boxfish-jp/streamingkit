import { videoCommands, checkSpecialCommand } from "../lib/videoCommands";
import writeCommand from "../lib/writeCommand";
import { eduRegist, eduRemove, filterComment } from "../lib/education";
import spotify from "../lib/spotify";
import gemini from "../lib/gemini";

const command = async (comment: string) => {
  if (comment === "" || comment === undefined) {
    return "";
  }

  if (comment.startsWith("邪神ちゃん、")) {
    return await gemini(comment);
  }
  const commands = await videoCommands();
  for (let command of commands) {
    if (comment.startsWith(command)) {
      await writeCommand(command);
      return comment.length > command.length ? comment : "";
    }
  }

  comment = await checkSpecialCommand(comment);
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
    return await new spotify(comment).playFromUrl();
  }
  if (comment.startsWith("spo:")) {
    const word = comment.replace("spo:", "");
    return await new spotify(word).playFromWord();
  }
  comment = await filterComment(comment);
  return comment;
};
export default command;
