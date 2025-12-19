import type { Message } from "kit_models";
import { getEducationCommands } from "./education.js";
import { getVideoCommands } from "./video_command.js";

export const getCommands = async (onMessage: (message: Message) => void) => {
  const videoCommands = await getVideoCommands();
  const educationCommands = getEducationCommands();
  //TODO: Spotifyコマンドの実装
  return [...videoCommands, ...educationCommands];
};
