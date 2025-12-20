import { getEducationCommands } from "./education.js";
import { getSpotifyCommand } from "./spotify_command.js";
import { getVideoCommands } from "./video_command.js";

export const getCommands = async () => {
  const videoCommands = await getVideoCommands();
  const educationCommands = getEducationCommands();
  const spotifyCommand = getSpotifyCommand();
  return [...videoCommands, ...educationCommands, spotifyCommand];
};
