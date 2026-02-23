import type { Command, InstSyntesizeMessage } from "kit_models";

export const getSpotifyCommand = (): Command => {
  return {
    isTarget: (comment) =>
      comment.content.startsWith("https://open.spotify.com/"),
    synthesize: (comment) => undefined,
    action: (comment) => {
      const urlobj = new URL(comment.content);
      const splitedPath = urlobj.pathname.split("/");
      const lint = lintPath(splitedPath);
      if (lint !== true) {
        return [
          {
            type: "instSynthesize",
            content: lint,
            channel: 4,
          } as InstSyntesizeMessage,
        ];
      }
      const trackIndex = splitedPath.indexOf("track") + 1;
      const trackUri = splitedPath[trackIndex];

      if (trackIndex === 0 || trackIndex > splitedPath.length || !trackUri) {
        return [
          {
            type: "instSynthesize",
            content: "urlが正しくないよ",
            channel: 4,
          } as InstSyntesizeMessage,
        ];
      }
      return [
        {
          type: "spotify",
          content: {
            instruction: "addQueue",
            uri: trackUri,
          },
        },
      ];
    },
  } as Command;
};

const lintPath = (path: string[]) => {
  for (const p of path) {
    if (p === "playlist") {
      return "playlistは未対応です";
    }
    if (p === "track") {
      return true;
    }
  }
  return "urlが正しくないよ";
};
