import EventEmitter from "node:events";
import type { ErrorMessage, Message } from "kit_models";

interface OauthClientEvents {
  onMessage: [message: Message];
}

export interface TokenRefreshConfig {
  endpoint: string;
  headers: HeadersInit;
  body: URLSearchParams;
  errorStatus: ErrorMessage["status"];
}

export class OauthClient extends EventEmitter<OauthClientEvents> {
  private _config: TokenRefreshConfig;
  protected _accessToken: string | null = null;
  private _refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: TokenRefreshConfig) {
    super();
    this._config = config;
  }

  get headers() {
    return {
      Authorization: `Bearer ${this._accessToken}`,
    };
  }

  async start(): Promise<void> {
    await this._tokenRefresh();
  }

  private async _tokenRefresh(): Promise<void> {
    try {
      const response = await fetch(this._config.endpoint, {
        method: "POST",
        headers: this._config.headers,
        body: this._config.body,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      this._accessToken = this._getAccessToken(data);
      const nextRefreshMs = this._calculateNextRefresh(data);

      if (this._refreshTimer) clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(
        () => this._tokenRefresh(),
        nextRefreshMs,
      );
    } catch (error) {
      this.emit("onMessage", {
        type: "error",
        status: this._config.errorStatus,
        time: Date.now(),
        message: `❌ トークン更新エラー: ${error}`,
      });
      setTimeout(() => this._tokenRefresh(), 60 * 1000);
    }
  }

  private _getAccessToken(responseJson: unknown) {
    if (
      typeof responseJson === "object" &&
      responseJson !== null &&
      "access_token" in responseJson &&
      typeof responseJson.access_token === "string"
    ) {
      return responseJson.access_token;
    }
    throw new Error("Invalid token response format");
  }

  private _calculateNextRefresh(responseJson: unknown) {
    if (
      typeof responseJson === "object" &&
      responseJson !== null &&
      "expires_in" in responseJson &&
      typeof responseJson.expires_in === "number" &&
      responseJson.expires_in > 300
    ) {
      return (responseJson.expires_in - 300) * 1000;
    }
    return 25 * 60 * 1000;
  }
}
