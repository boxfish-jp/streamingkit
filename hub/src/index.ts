import command from "./command";

process.stdin.setEncoding("utf8");

let nicoComeNum = 0;
process.stdin.on("data", async (chunk: string) => {
  let comment = [];
  if (chunk.startsWith("{")) {
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
        if (d.content && d.no && d.no > nicoComeNum) {
          comment.push(d.content);
          nicoComeNum = d.no;
        }
      }
    }
  } else {
    comment.push(chunk.split("content:")[1]);
  }
  for (let comme of comment) {
    command(comme);
  }
});
