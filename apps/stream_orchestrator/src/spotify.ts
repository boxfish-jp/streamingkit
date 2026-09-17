import { OauthClient } from "oauth_client";
import type { TokenStore } from "token_store";

export interface TrackInfo {
  artist: string;
  title: string;
  album: string;
  artUrl: string;
  trackId: string;
  position: number;
  length: number;
}

export class SpotifyClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, tokenStore: TokenStore) {
    super({
      tokenStore,
      provider: "spotify",
      authConfig: {
        authorizeEndpoint: "https://accounts.spotify.com/authorize",
        tokenEndpoint: "https://accounts.spotify.com/api/token",
        scopes: [
          "user-read-playback-state",
          "user-modify-playback-state",
          "user-read-currently-playing",
        ],
      },
      clientId,
      clientSecret,
      errorStatus: "serverFailedToGetSpotifyToken",
    });
  }

  async getCurrentTrack(): Promise<TrackInfo | null> {
    if (!this._accessToken) {
      throw new Error("Spotifyのアクセストークンがありません");
    }

    const url = "https://api.spotify.com/v1/me/player/currently-playing";
    const response = await fetch(url, { headers: this.headers });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `再生中曲の取得エラー (${response.status}): ${errorText}`,
      );
    }

    const body = await response.json();
    const item = body?.item;
    if (item?.type !== "track") {
      return null;
    }

    return {
      artist: (item.artists ?? [])
        .map((artist: { name: string }) => artist.name)
        .join("、"),
      title: item.name,
      album: item.album?.name ?? "",
      artUrl: item.album?.images?.[0]?.url ?? "",
      trackId: item.id ?? "",
      position: body.progress_ms ?? 0,
      length: item.duration_ms ?? 0,
    };
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
