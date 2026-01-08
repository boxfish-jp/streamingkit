import EventEmitter from "node:events";
import type { Message } from "kit_models";

interface SpotifyClientEvents {
  onMessage: [message: Message];
}

export class SpotifyClient extends EventEmitter<SpotifyClientEvents> {
  private _clientId: string;
  private _clientSecret: string;
  private _refreshToken: string;
  private _accessToken: string | null = null;
  private _refreshTimer: NodeJS.Timeout | null = null;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    super();
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._refreshToken = refreshToken;
  }

  /**
   * クライアントを開始する（最初のトークン取得と定期更新のセットアップ）
   * アプリ起動時に必ず1回呼んでください。
   */
  async start(): Promise<void> {
    await this._tokenRefresh();
  }

  /**
   * 指定した曲をキューに追加する
   * @param trackUri Spotify URI (例: spotify:track:xxxx)
   */
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
        headers: {
          Authorization: `Bearer ${this._accessToken}`,
        },
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

  /**
   * 内部用: トークンを更新し、次の更新タイマーをセットする
   */
  private async _tokenRefresh(): Promise<void> {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", this._refreshToken);

    const authHeader = Buffer.from(
      `${this._clientId}:${this._clientSecret}`,
    ).toString("base64");

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
        body: params,
      });

      if (!response.ok) {
        const text = await response.text();
        this.emit("onMessage", {
          type: "error",
          status: "serverFailedToGetSpotifyToken",
          time: Date.now(),
          message: `❌ トークン更新エラー (${response.status}): ${text}`,
        });
      }

      const data = await response.json();
      this._accessToken = data.access_token;
      const expiresIn = data.expires_in;
      const nextRefreshMs = (expiresIn - 300) * 1000;

      if (this._refreshTimer) clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(
        () => this._tokenRefresh(),
        nextRefreshMs,
      );
    } catch (error) {
      this.emit("onMessage", {
        type: "error",
        status: "serverFailedToGetSpotifyToken",
        time: Date.now(),
        message: `❌ トークン更新エラー: ${error}`,
      });
      setTimeout(() => this._tokenRefresh(), 60 * 1000);
    }
  }
}
