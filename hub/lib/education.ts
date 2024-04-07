import { writeFileSync, readFileSync } from "fs";

const readFile = () => {
  return JSON.parse(readFileSync("./hub/education.json", "utf-8")) as {
    [key: string]: string;
  };
};

const writeFile = (data: any) => {
  try {
    writeFileSync("./hub/education.json", data);
  } catch (error) {
    console.log(error);
  }
};

const eduRegist = async (word: string, replace: string) => {
  const eduData = readFile();
  eduData[word] = replace;
  const eduJson = JSON.stringify(eduData, null, 2);
  writeFile(eduJson);
};

const eduRemove = async (word: string) => {
  const eduData = readFile();
  delete eduData[word];
  const eduJson = JSON.stringify(eduData, null, 2);
  writeFile(eduJson);
};

const filterComment = async (comment: string) => {
  if (comment.search(/https?:\/\//) !== -1) {
    comment = comment.replace(
      /https?:\/\/[\w!?/\+\-_~=;\.,*&@#$%\(\)\'\[\]]+(\?[a-zA-Z0-9%=\-&_]+)?/g,
      "URL省略"
    );
  }
  const eduData = readFile();
  for (let key in eduData) {
    if (comment.indexOf(key) !== -1) {
      comment = comment.replace(new RegExp(key, "g"), eduData[key]);
    }
  }
  return comment;
};

export { eduRegist, eduRemove, filterComment };
