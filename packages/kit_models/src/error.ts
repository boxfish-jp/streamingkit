export interface ErrorMessage {
  type: "error";
  status:
    | "clientSocketConnection"
    | "clientSocketDisconnected"
    | "serverStopComment"
    | "serverWatchComment"
    | "serverGetStreamInfo"
    | "serverSynthesize"
    | "serverSynthesizeDelay"
    | "serverReadEducation"
    | "serverWriteEducation"
    | "serverSpotifyTokenNotFound"
    | "serverFailedToGetSpotifyToken"
    | "serverFailedToAddSpotifyQueue"
    | "serverYoutubeTokenNotFound"
    | "serverFailedToGetYoutubeToken"
    | "serverFailedToGetYoutubeComment";
  time: number;
  message?: string;
}

export type NotifyError = (error: string) => void;
