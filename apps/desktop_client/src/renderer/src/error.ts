import type { ErrorMessage, Message, SynthesizedMessage } from "kit_models";
import clientSocketConnectionErrorWav from "./assets/client_socket_connection_error.wav";
import clientSocketDisconectedWav from "./assets/client_socket_disconnected.wav";
import serverFailedToAddSpotifyQueueWav from "./assets/server_failed_to_add_spotify_queue.wav";
import serverFailedToGetSpotifyTokenWav from "./assets/server_failed_to_get_spotify_token.wav";
import serverGetStreamInfoWav from "./assets/server_get_stream_info.wav";
import serverReadEducationWav from "./assets/server_read_education.wav";
import serverSpotifyTokenNotFoundWav from "./assets/server_spotify_token_not_found.wav";
import serverStopCommentWav from "./assets/server_stop_comment.wav";
import serverSynthesizeWav from "./assets/server_synthesize.wav";
import serverWatchCommentWav from "./assets/server_watch_comment.wav";
import serverWriteEducationWav from "./assets/server_write_education.wav";

export class ErrorHandler {
  private _lastError = { status: "", time: 0 };

  async onError(error: ErrorMessage): Promise<Message | undefined> {
    switch (error.status) {
      case "clientSocketConnection":
        if (
          this._lastError.status !== error.status &&
          this._lastError.time + 60000 < error.time
        ) {
          this._lastError = { status: error.status, time: Date.now() };
          return await this._synthesizeErrorAnnouncement(
            clientSocketConnectionErrorWav,
          );
        }
        return undefined;
      case "clientSocketDisconnected":
        if (
          this._lastError.status !== error.status ||
          this._lastError.time + 60000 < error.time
        ) {
          this._lastError = { status: error.status, time: Date.now() };
          return await this._synthesizeErrorAnnouncement(
            clientSocketDisconectedWav,
          );
        }
        return undefined;
      case "serverFailedToGetSpotifyToken":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(
          serverFailedToGetSpotifyTokenWav,
        );
      case "serverFailedToAddSpotifyQueue":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(
          serverFailedToAddSpotifyQueueWav,
        );
      case "serverSpotifyTokenNotFound":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(
          serverSpotifyTokenNotFoundWav,
        );
      case "serverStopComment":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverStopCommentWav);
      case "serverWatchComment":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverWatchCommentWav);
      case "serverGetStreamInfo":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverGetStreamInfoWav);
      case "serverSynthesize":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverSynthesizeWav);
      case "serverReadEducation":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverReadEducationWav);
      case "serverWriteEducation":
        this._lastError = { status: error.status, time: Date.now() };
        return await this._synthesizeErrorAnnouncement(serverWriteEducationWav);
      default:
        return undefined;
    }
  }

  private _synthesizeErrorAnnouncement = async (path: string) => {
    const response = await fetch(path);
    return {
      type: "synthesized",
      buffer: (await response.arrayBuffer()) as any,
      tag: "announce",
    } as SynthesizedMessage;
  };
}
