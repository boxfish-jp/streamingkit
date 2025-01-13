import { readdir } from "fs";
import path from "path";
import writeCommand from "../lib/writeCommand";

export const videoCommands = async () => {
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

export const checkSpecialCommand = async (comment: string) => {
  if (comment.startsWith("エクスプロージョン")) {
    const random = Math.floor(Math.random() * 100);
    if (random < 25) {
      await writeCommand("エクスプロージョン1");
    } else if (random >= 25 && random < 50) {
      await writeCommand("エクスプロージョン2");
    } else if (random >= 50 && random < 75) {
      await writeCommand("エクスプロージョン3");
    } else {
      await writeCommand("エクスプロージョン4");
    }
    comment = "";
  }
  else if (comment.startsWith("?")) {
    await writeCommand("？");
    comment = "";
  } else if (comment.startsWith("8888")) {
    await writeCommand("８８８８");
    comment = "";
  } else if (comment.startsWith("omg")) {
    await writeCommand("OMG");
    comment = "";
  }
  return comment;
} 
