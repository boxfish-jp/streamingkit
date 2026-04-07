export interface NotifyMessage {
  type: "notify";
  status:
    | "clientSocketConnected"
    | "successfulAddSpotifyQueue"
    | "startYoutubeStreaming"
    | "startNicoNicoStreaming"
    | "endYoutubeStreaming"
    | "endNicoNicoStreaming";
}
