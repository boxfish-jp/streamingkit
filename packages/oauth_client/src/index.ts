import EventEmitter from "node:events";
import * as fs from "node:fs/promises";
import type { ErrorMessage, Message } from "kit_models";

interface OauthClientEvents {
  onMessage: [message: Message];
}

export interface TokenRefreshConfig {
  endpoint: string;
  headers: HeadersInit;
  body: URLSearchParams;
  initialRefreshToken: string;
  saveSetting?: {
    envFilePath: string;
    prefix: string;
  };
  errorStatus: ErrorMessage["status"];
}

export class OauthClient extends EventEmitter<OauthClientEvents> {
  private _config: TokenRefreshConfig;
  protected _accessToken: string | null = null;
  protected _refreshToken: string;
  private _refreshTimer: NodeJS.Timeout | null = null;
  private _isFirstRun: boolean = true;

  constructor(config: TokenRefreshConfig) {
    super();
    this._config = config;
    this._refreshToken = config.initialRefreshToken;
  }

  get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this._accessToken}`,
    };
  }

  getRefreshToken(): string | null {
    return this._refreshToken;
  }

  async start(): Promise<void> {
    await this._tokenRefresh();
  }

  private async _tokenRefresh(): Promise<void> {
    try {
      const bodyParams = new URLSearchParams(this._config.body);

      if (!this._isFirstRun && this._refreshToken) {
        bodyParams.set("grant_type", "refresh_token");
        bodyParams.set("refresh_token", this._refreshToken);
      }

      const response = await fetch(this._config.endpoint, {
        method: "POST",
        headers: this._config.headers,
        body: bodyParams,
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

      const expires_in = this._getNumberField(data, "expires_in") ?? 300;

      if (this._config.saveSetting) {
        await this._saveTokensToEnv(
          this._accessToken,
          this._refreshToken,
          expires_in,
        );
      }

      this._isFirstRun = false;
      const nextRefreshMs = this._calculateNextRefresh(expires_in);

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
      // エラー時は 60 秒後にリトライ
      setTimeout(() => this._tokenRefresh(), 60 * 1000);
    }
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

  private _calculateNextRefresh(expires_in: number): number {
    const ms = Math.max(1000, (expires_in - 300) * 1000);
    return Math.min(ms, 2147483647);
  }

  private async _saveTokensToEnv(
    access_token: string,
    refresh_token: string,
    expires_in: number,
  ): Promise<void> {
    if (!this._config.saveSetting) return;
    const envPath = this._config.saveSetting.envFilePath;
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;

    const prefix = this._config.saveSetting.prefix;
    const updates: Record<string, string> = {
      [`${prefix}_ACCESS_TOKEN`]: access_token,
      [`${prefix}_REFRESH_TOKEN`]: refresh_token,
      [`${prefix}_ACCESS_TOKEN_EXPIRES_AT`]: String(expiresAt),
    };

    try {
      let content = "";
      try {
        content = await fs.readFile(envPath, "utf-8");
      } catch {
        // ファイルが存在しない場合は空文字で続行
      }

      const lines = content.split("\n");
      const updatedKeys = new Set(Object.keys(updates));
      const newLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) {
          newLines.push(line);
          continue;
        }
        const key = trimmed.split("=")[0].trim();
        if (updatedKeys.has(key)) continue;
        newLines.push(line);
      }

      for (const [key, value] of Object.entries(updates)) {
        newLines.push(`${key}=${value}`);
      }

      // 権限 600（オーナーのみ読み書き可）で書き込み
      await fs.writeFile(envPath, `${newLines.join("\n").trim()}\n`, {
        mode: 0o600,
      });
    } catch (err) {
      console.error(`[OAuth] Failed to save tokens to ${envPath}:`, err);
      this.emit("onMessage", {
        type: "error",
        status: this._config.errorStatus,
        time: Date.now(),
        message: `! .env ファイルへのトークン保存に失敗しました`,
      });
    }
  }
}
