import type { Command } from "kit_models";
import { normalizeLowerCase } from "../clean.js";
import { getEducationCommands } from "./education.js";
import { getSpotifyCommand } from "./spotify_command.js";
import { getVideoCommands } from "./video_command.js";

export const getCommands = async () => {
  const videoCommands = await getVideoCommands();
  const educationCommands = getEducationCommands();
  const spotifyCommand = getSpotifyCommand();
  return [
    ...videoCommands,
    ...educationCommands,
    spotifyCommand,
    progressCommand,
  ];
};

const progressCommand = {
  isTarget: (message) => message.content.startsWith("進捗"),
  action: () => [
    {
      type: "todoShow",
      instruction: "show",
    },
  ],
  synthesize: (message) => {
    return {
      type: "instSynthesize",
      content: normalizeLowerCase(message.content),
      channel: 0,
    };
  },
} as Command;
