import type { Command, SendCommentMessage } from "kit_models";
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
    nurupoCommand,
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

const nurupoCommand = {
  isTarget: (message) => message.content.startsWith("ぬるぽ"),
  action: () => [
    {
      type: "sendComment",
      site: "niconico",
      content: "ガッ",
    } as SendCommentMessage,
    {
      type: "sendComment",
      site: "youtube",
      content: "ガッ",
    } as SendCommentMessage,
  ],
  synthesize: () => undefined,
} as Command;
