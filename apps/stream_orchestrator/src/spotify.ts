import { OauthClient } from "oauth_client";

export class SpotifyClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", refreshToken);

    super({
      endpoint: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`,
        ).toString("base64")}`,
      },
      body: body,
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

      // よくあるエラー: デバイスが見つからない場合
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
