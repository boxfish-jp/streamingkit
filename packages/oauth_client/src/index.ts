import { randomBytes } from "node:crypto";
import EventEmitter from "node:events";
import http from "node:http";
import type { ErrorMessage, Message } from "kit_models";
import type { TokenStore } from "token_store";

interface OauthClientEvents {
  onMessage: [message: Message];
}

export interface AuthConfig {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  callbackPort: number;
}

export interface OauthClientConfig {
  tokenStore: TokenStore;
  provider: string;
  authConfig: AuthConfig;
  clientId: string;
  clientSecret: string;
  errorStatus: ErrorMessage["status"];
}

export class OauthClient extends EventEmitter<OauthClientEvents> {
  private _config: OauthClientConfig;
  protected _accessToken: string | null = null;
  protected _refreshToken: string | null = null;
  private _refreshTimer: NodeJS.Timeout | null = null;
  private _notifyTimer: NodeJS.Timeout | null = null;

  constructor(config: OauthClientConfig) {
    super();
    this._config = config;
  }

  get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this._accessToken}`,
    };
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  isTokenValid(): boolean {
    return this._accessToken !== null && this._refreshToken !== null;
  }

  async start(): Promise<void> {
    const stored = this._config.tokenStore.getToken(this._config.provider);
    if (stored) {
      this._accessToken = stored.access_token;
      this._refreshToken = stored.refresh_token;
      await this._tokenRefresh();
    } else {
      await this._runAuthorizationFlow();
    }
  }

  private _buildAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this._config.clientId,
      response_type: "code",
      redirect_uri: `http://localhost:${this._config.authConfig.callbackPort}/callback`,
      scope: this._config.authConfig.scopes.join(" "),
    });
    if (state) {
      params.set("state", state);
    }
    return `${this._config.authConfig.authorizeEndpoint}?${params.toString()}`;
  }

  private async _runAuthorizationFlow(): Promise<void> {
    return new Promise((resolve, reject) => {
      const state = randomBytes(16).toString("hex");
      const authUrl = this._buildAuthorizationUrl(state);
      const port = this._config.authConfig.callbackPort;

      const server = http.createServer(async (req, res) => {
        if (!req.url) return;
        const url = new URL(req.url, `http://localhost:${port}`);
        if (url.pathname !== "/callback") return;

        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");

        if (!code || returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("認証に失敗しました");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>認証完了</h1><p>このタブは閉じてください。</p>");
        server.close();

        try {
          await this._exchangeCodeForTokens(code);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `ポート ${port} は既に使用中です。他のプロセスを停止してください。`,
          );
        }
        reject(err);
      });

      server.listen(port, () => {
        console.log(`ブラウザで以下を開いて認証してください:\n${authUrl}\n`);
      });
    });
  }

  private async _exchangeCodeForTokens(code: string): Promise<void> {
    const response = await fetch(this._config.authConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this._config.clientId}:${this._config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `http://localhost:${this._config.authConfig.callbackPort}/callback`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    const accessToken = this._getStringField(data, "access_token");
    const refreshToken = this._getStringField(data, "refresh_token");
    if (!accessToken || !refreshToken) {
      throw new Error(
        "Response does not contain access_token or refresh_token",
      );
    }

    this._accessToken = accessToken;
    this._refreshToken = refreshToken;

    const expiresIn = this._getNumberField(data, "expires_in") ?? 300;
    this._saveTokens(accessToken, refreshToken, expiresIn);

    const nextRefreshMs = this._calculateNextRefresh(expiresIn);
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => this._tokenRefresh(), nextRefreshMs);
  }

  private _saveTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): void {
    const now = Math.floor(Date.now() / 1000);
    this._config.tokenStore.saveToken(this._config.provider, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: now + expiresIn,
      updated_at: now,
    });
  }

  private async _tokenRefresh(): Promise<void> {
    try {
      if (!this._refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(this._config.authConfig.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this._config.clientId}:${this._config.clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this._refreshToken,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();

      const newAccessToken = this._getStringField(data, "access_token");
      if (!newAccessToken) {
        throw new Error("Response does not contain access_token");
      }
      this._accessToken = newAccessToken;

      const newRefreshToken = this._getStringField(data, "refresh_token");
      if (newRefreshToken) {
        this._refreshToken = newRefreshToken;
      }

      const expiresIn = this._getNumberField(data, "expires_in") ?? 300;
      this._saveTokens(this._accessToken, this._refreshToken, expiresIn);

      const nextRefreshMs = this._calculateNextRefresh(expiresIn);
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
        message: `❌ トークン更新エラー: ${error instanceof Error ? error.message : String(error)}`,
      });
      this._startReauthorization();
    }
  }

  private _startReauthorization(): void {
    console.error(
      `トークンが無効です。以下のURLで再認可してください：\n${this._buildAuthorizationUrl()}`,
    );

    const providerLabel =
      this._config.provider.charAt(0).toUpperCase() +
      this._config.provider.slice(1);

    this._notifyTimer = setInterval(() => {
      this.emit("onMessage", {
        type: "notify",
        status: "serverNeedAuthorization",
        time: Date.now(),
        message: `${providerLabel}の認証が必要です`,
      });
    }, 60 * 1000);

    this._waitForReauthorization();
  }

  private _waitForReauthorization(): void {
    const state = randomBytes(16).toString("hex");
    const port = this._config.authConfig.callbackPort;

    const server = http.createServer(async (req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, `http://localhost:${port}`);
      if (url.pathname !== "/callback") return;

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      if (!code || returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("認証に失敗しました");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>認証完了</h1><p>このタブは閉じてください。</p>");
      server.close();

      if (this._notifyTimer) {
        clearInterval(this._notifyTimer);
        this._notifyTimer = null;
      }

      try {
        await this._exchangeCodeForTokens(code);
      } catch (error) {
        console.error("再認可に失敗しました:", error);
        this._startReauthorization();
      }
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`ポート ${port} は既に使用中です。`);
      }
    });

    server.listen(port);
  }

  private _getStringField(obj: unknown, key: string): string | null {
    if (typeof obj === "object" && obj !== null && key in obj) {
      const val = (obj as Record<string, unknown>)[key];
      if (typeof val === "string") return val;
    }
    return null;
  }

  private _getNumberField(obj: unknown, key: string): number | null {
    if (typeof obj === "object" && obj !== null && key in obj) {
      const val = (obj as Record<string, unknown>)[key];
      if (typeof val === "number") return val;
    }
    return null;
  }

  private _calculateNextRefresh(expiresIn: number): number {
    const ms = Math.max(1000, (expiresIn - 300) * 1000);
    return Math.min(ms, 2147483647);
  }
}
