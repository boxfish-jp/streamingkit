import command from "./command";
import makeImgTxt from "../lib/stablediffusion";
import extractPrompt from "../lib/sdParseCommand";

process.stdin.setEncoding("utf8");

let setuping = true;
setTimeout(() => {
  setuping = false;
}, 5000);

let sDcommands: {
  user_id: string;
  command: { prompt: string; negative: string; batch: number; steps: number };
}[] = [];

const sdParseCom = (command: string) => {
  const result = extractPrompt(command);
  const batch = isNaN(Number(result[2])) ? 1 : Number(result[2]);
  const steps = isNaN(Number(result[3])) ? 1 : Number(result[3]);
  return {
    prompt: result[0],
    negative: result[1],
    batch: batch,
    steps: steps,
  };
};

let nicoComeNum = 0;
process.stdin.on("data", async (chunk: string) => {
  let comment: { id: string; content: string }[] = [];
  const styleChunk = "[" + chunk.trim().slice(0, -1) + "]";
  const data = JSON.parse(styleChunk) as {
    thread: string;
    no: number;
    vpos: number;
    date: number;
    mail: string;
    user_id: string;
    premium: number;
    anonymity: number;
    content: string;
  }[];
  if (data.length > 0) {
    for (let d of data) {
      if (d.content && d.no) {
        if (d.no > nicoComeNum) {
          comment.push({ id: d.user_id, content: d.content });
          nicoComeNum = d.no;
        } else if (d.no == -1) {
          comment.push({ id: d.user_id, content: d.content });
        }
      }
    }
  }
  if (comment.length == 1 && !setuping && comment[0].id && comment[0].content) {
    let comme = comment[0];
    comme.content = comme.content.replace("\n", "");
    // stable diffusionの処理
    if (comme.content.startsWith("p:") || comme.content.startsWith("n:")) {
      if (!comme.content.endsWith("/c")) {
        const command = sdParseCom(comme.content);
        const index = sDcommands.findIndex((v) => v.user_id === comme.id);
        if (index == -1) {
          comme.content = await makeImgTxt(
            command.prompt,
            command.negative,
            command.batch,
            command.steps
          );
        } else {
          const beforeCommand = sDcommands[index].command;
          comme.content = await makeImgTxt(
            beforeCommand.prompt + command.prompt,
            beforeCommand.negative + command.negative,
            command.batch,
            command.steps
          );
          sDcommands = sDcommands.filter((v) => v.user_id !== comme.id);
        }
      } else {
        const command = sdParseCom(comme.content.replace("/c", ""));
        // 既に配列にuser_idが存在するか
        const index = sDcommands.findIndex((v) => v.user_id === comme.id);
        if (index === -1) {
          sDcommands.push({
            user_id: comme.id,
            command: {
              prompt: command.prompt,
              negative: command.negative,
              batch: command.batch,
              steps: command.steps,
            },
          });
          comme.content = "続きを入力してね";
        } else {
          const beforeCommand = sDcommands[index].command;
          sDcommands[index].command = {
            prompt: beforeCommand.prompt + command.prompt,
            negative: beforeCommand.negative + command.negative,
            batch: command.batch,
            steps: command.steps,
          };
          comme.content = "続きを入力してね";
        }
      }
    }
    // stable diffusionの処理ここまで
    comme.content = await command(comme.content);
    console.log(comme.content);
  }
});
