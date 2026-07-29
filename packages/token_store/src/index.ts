import Database from "better-sqlite3";

export interface TokenRecord {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
  updated_at: number;
}

export interface TokenStore {
  getToken(provider: string): TokenRecord | null;
  saveToken(provider: string, tokens: TokenRecord): void;
}

export class SqliteTokenStore implements TokenStore {
  private _db: Database.Database;

  constructor(dbPath: string) {
    this._db = new Database(dbPath);
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        provider TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at INTEGER,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  getToken(provider: string): TokenRecord | null {
    const row = this._db
      .prepare(
        "SELECT access_token, refresh_token, expires_at, updated_at FROM oauth_tokens WHERE provider = ?",
      )
      .get(provider) as TokenRecord | undefined;
    return row ?? null;
  }

  saveToken(provider: string, tokens: TokenRecord): void {
    this._db
      .prepare(
        `INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(provider) DO UPDATE SET
           access_token = excluded.access_token,
           refresh_token = excluded.refresh_token,
           expires_at = excluded.expires_at,
           updated_at = excluded.updated_at`,
      )
      .run(
        provider,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_at,
        tokens.updated_at,
      );
  }
}
