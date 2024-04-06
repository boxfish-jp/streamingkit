import command from "./command";

process.stdin.setEncoding("utf8");

let setuping = true;
setTimeout(() => {
  setuping = false;
}, 5000);

let nicoComeNum = 0;
process.stdin.on("data", async (chunk: string) => {
  let comment = [];
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
          comment.push(d.content);
          nicoComeNum = d.no;
        } else if (d.no == -1) {
          comment.push(d.content);
        }
      }
    }
  }
  if (comment.length == 1 && !setuping) {
    let comme = comment[0];
    comme = comme.replace("\n", "");
    comme = await command(comme);
    console.log(comme);
  }
});
