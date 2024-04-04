import { writeFileSync } from "fs";

const writeCommand = async (command: string) => {
  try {
    writeFileSync("./front/change.js", `const command = "${command}";`);

    // 500ms待機
    await new Promise((resolve) => setTimeout(resolve, 500));

    writeFileSync("./front/change.js", `const command = "";`);
  } catch (error) {
    console.log(error);
  }
};

export default writeCommand;
