import { OauthClient } from "oauth_client";
import type { TokenStore } from "token_store";

export class SpotifyClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, tokenStore: TokenStore) {
    super({
      tokenStore,
      provider: "spotify",
      authConfig: {
        authorizeEndpoint: "https://accounts.spotify.com/authorize",
        tokenEndpoint: "https://accounts.spotify.com/api/token",
        scopes: ["user-read-playback-state", "user-modify-playback-state"],
        callbackPort: 5000,
      },
      clientId,
      clientSecret,
      errorStatus: "serverFailedToGetSpotifyToken",
    });
  }

  async addQueue(trackUri: string): Promise<void> {
    if (!this._accessToken) {
      this.emit("onMessage", {
        type: "error",
        status: "serverSpotifyTokenNotFound",
        time: Date.now(),
      });
    }

    const url = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(`spotify:track:${trackUri}`)}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
      });

      if (response.ok) {
        this.emit("onMessage", {
          type: "notify",
          status: "successfulAddSpotifyQueue",
        });
        return;
      }

      const errorText = await response.text();

      if (response.status === 404) {
        this.emit("onMessage", {
          type: "error",
          status: "serverFailedToAddSpotifyQueue",
          time: Date.now(),
          message:
            "! 警告: アクティブなデバイスが見つかりません。Spotifyで音楽を再生中ですか？",
        });
      } else {
        this.emit("onMessage", {
          type: "error",
          status: "serverFailedToAddSpotifyQueue",
          time: Date.now(),
          message: `❌ キュー追加エラー (${response.status}): ${errorText}`,
        });
      }
    } catch (error) {
      this.emit("onMessage", {
        type: "error",
        status: "serverFailedToAddSpotifyQueue",
        time: Date.now(),
        message: `❌ 通信エラーが発生しました。${error}`,
      });
    }
  }
}
