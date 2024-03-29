import { readdir } from "fs";
import path from "path";

const videoCommands = async () => {
  const directoryPath = path.join(__dirname, "../../video");

  return new Promise<string[]>((resolve, reject) => {
    readdir(directoryPath, (err, files) => {
      if (err) {
        console.log("Unable to scan directory: " + err);
        reject(err);
      } else {
        const commands = files.map((file) => file.replace(".mp4", ""));
        resolve(commands);
      }
    });
  });
};

export default videoCommands;
