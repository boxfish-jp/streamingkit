interface AddQueue {
  instruction: "addQueue";
  uri: string;
}

interface GetCurrentTrack {
  instruction: "getCurrentTrack";
}

export interface SpotifyMessage {
  type: "spotify";
  content: AddQueue | GetCurrentTrack;
}
