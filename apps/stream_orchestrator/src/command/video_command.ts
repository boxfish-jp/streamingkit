import { readdir } from "node:fs";
import type {
  Command,
  CommentMessage,
  InstSyntesizeMessage,
  VideoMessage,
} from "kit_models";
import { normalizeLowerCase } from "../clean.js";

export const getVideoCommands = async () => {
  const keywords = await new Promise<string[]>((resolve, reject) => {
    readdir("../../video", (err, files) => {
      if (err) {
        console.log("Unable to scan directory: ");
        reject(err);
      } else {
        const commands = files.map((file) => file.replace(".mp4", ""));
        resolve(commands);
      }
    });
  });
  const commands: Command[] = [];
  for (const keyword of keywords) {
    commands.push({
      isTarget: (comment) =>
        normalizeLowerCase(comment.content).startsWith(keyword),
      synthesize: (comment: CommentMessage) => {
        if (normalizeLowerCase(comment.content).length > keyword.length) {
          return {
            type: "instSynthesize",
            content: normalizeLowerCase(comment.content),
            tag: "comment",
          } as InstSyntesizeMessage;
        }
      },
      action: () => {
        return [
          {
            type: "video",
            name: keyword,
          } as VideoMessage,
        ];
      },
    });
  }
  return commands;
};
