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

export { eduRegist, eduRemove };
