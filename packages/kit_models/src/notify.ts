export interface NotifyMessage {
  type: "notify";
  status:
    | "clientSocketConnected"
    | "successfulAddSpotifyQueue"
    | "startStreaming"
    | "endStreaming";
}
