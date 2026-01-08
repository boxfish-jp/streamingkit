interface AddQueue {
  instruction: "addQueue";
  uri: string;
}

export interface SpotifyMessage {
  type: "spotify";
  content: AddQueue;
}
