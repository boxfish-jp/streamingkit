import EventEmitter from "node:events";
import type { ErrorMessage, Message } from "kit_models";

interface OauthClientEvents {
  onMessage: [message: Message];
}

export interface TokenRefreshConfig {
  endpoint: string;
  method: string;
  headers: HeadersInit;
  body: URLSearchParams;
  calcInterval: (responseJson: unknown) => number;
  errorStatus: ErrorMessage["status"];
}

export class OauthClient extends EventEmitter<OauthClientEvents> {
  private _config: TokenRefreshConfig;
  private _accessToken: string | null = null;
  private _refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: TokenRefreshConfig) {
    super();
    this._config = config;
  }

  async start(): Promise<void> {
    await this._tokenRefresh();
  }

  private async _tokenRefresh(): Promise<void> {
    try {
      const response = await fetch(this._config.endpoint, {
        method: this._config.method,
        headers: this._config.headers,
        body: this._config.body,
      });

      if (!response.ok) {
        const text = await response.text();
        this.emit("onMessage", {
          type: "error",
          status: this._config.errorStatus,
          time: Date.now(),
          message: `❌ トークン更新エラー (${response.status}): ${text}`,
        });
      }

      const data = await response.json();
      this._accessToken = data.access_token;
      const nextRefreshMs = this._config.calcInterval(data);

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
}
