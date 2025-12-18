import type { Message } from "kit_models";
import { getVideoCommands } from "./video_command.js";

export const getCommands = async (onMessage: (message: Message) => void) => {
  const videoCommands = await getVideoCommands();
  //TODO: 教育コマンドの実装
  //TODO: Spotifyコマンドの実装
  return [...videoCommands];
};
