# OAuth Token Management 計画

## 現状の課題

1. **初期トークン取得が手動** - Spotify用スクリプトは`CLIENT_ID`が空で手動入力が必要、Nightbotは完全手動
2. **トークン保存が`.env`** - Nightbotのみ`.env`に自動保存（Nightbotは毎refreshでrefresh_tokenがローテートするため保存必須）。Spotifyは保存されないが、Spotifyは毎回refresh_tokenが返るわけではなく6ヶ月で失効するため、再認可時に備えた保存機構は必要
3. **DBが存在しない** - ファイルベースの管理

## 方針

- **CLIENT_ID, CLIENT_SECRET** → `.env`のまま（不変なので）
- **REFRESH_TOKEN, ACCESS_TOKEN, EXPIRES_AT** → SQLite DBで管理
- **初回起動時**にDBにトークンがなければ、自動的にブラウザで認可フローを開始
- `.env`から`*_REFRESH_TOKEN`行を削除

## 構成

### 1. `packages/token_store` 新規作成

- `better-sqlite3` を使用
- インターフェースと実装を分離してexport（テスト時のモック注入を容易にする）

#### インターフェース

```typescript
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
```

#### 実装: `SqliteTokenStore`

- コンストラクタ: `constructor(dbPath: string)`
  - `better-sqlite3` でDBファイルを開く（なければ作成）
  - `oauth_tokens` テーブルが存在しなければ `CREATE TABLE` する

#### スキーマ

```sql
CREATE TABLE oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL
);
```

**注意**: `access_token` は NULL 許容（`NOT NULL` 制約なし）だが、`TokenRecord` インターフェースでは `access_token: string`（非null）。整合性を確認し、スキーマに `NOT NULL` を追加するか、インターフェースを `string | null` に合わせる必要がある。

### 2. `packages/oauth_client` 改修

- `token_store` から `TokenStore` interface をインポート（`getToken(provider)`, `saveToken(provider, tokens)`）
- `saveSetting`（.env保存）を削除 → `tokenStore`に置き換え
- **認可コードフロー**メソッド`_runAuthorizationFlow()`を追加:
  - `node:http` で `localhost:5000` に一時的なHTTPサーバー起動
  - ターミナルに認可URLを出力
  - コールバックで `code` 受信 → サーバー閉じる → token交換 → DB保存
- `OauthClient`のコンストラクタに`tokenStore`, `provider`, `authConfig`（認可URL等）を渡す
- **音声通知**: 認証が必要な時に `serverNeedAuthorization` ステータスの `onMessage` イベントを発行
- **エラーログ**: トークン無効時に `console.error` で認可URLを出力
- **`_isFirstRun` フラグの削除**: 現コードの `_tokenRefresh()` は初回呼び出し時に `grant_type` を body から読む等特殊処理をしているが、新設計ではDBからトークンを読み込んでから起動するため不要。リファクタリングで削除する
- **認可フローの再トリガー条件**: 稼働中にrefresh tokenが無効化された場合:
  - `console.error` に認可URLを出力する（クリックまたはコピペでブラウザで開けるURL形式）
  - 60秒ごとに `serverNeedAuthorization` の音声通知を繰り返し流し、ユーザーに再認可を促す
  - ユーザーがブラウザで認可を完了すると、コールバックサーバーが `code` を受信 → token交換 → DB保存 → 音声通知停止 → refreshサイクル再開
  - 認可完了まで音声通知は止まらない
- **ポート競合時のフォールバック**: `localhost:5000` が既に使用中の場合のエラーハンドリングを追加する

### 3. `apps/stream_orchestrator` 修正

- 起動フロー:
  1. `TokenStore`初期化
  2. DBからトークン取得を試みる
  3. **トークンなし** → 自動で認可フロー開始（Spotify → Nightbotの順）
  4. **トークンあり** → そのまま`OauthClient`開始
- `.env`からは`CLIENT_ID`/`CLIENT_SECRET`のみ読み込み
- `scripts/get_spotify_token.ts` は削除
- **音声通知対応**: `OauthClient` の `onMessage` イベントで `serverNeedAuthorization` を受信したら `SynthesizeRunner` に投入

### 4. 起動時の流れ

**初回:**
```
起動 → DB確認: トークンなし
→ Spotify認可フロー自動開始（ブラウザ自動オープン）
→ ユーザーが認可 → DB保存
→ Nightbot認可フロー自動開始
→ ユーザーが認可 → DB保存
→ 通常の配信処理開始
```

**2回目以降:**
```
起動 → DBからトークン読み込み
→ OauthClient開始（自動リフレッシュ）
→ 通常の配信処理開始
```

## 影響ファイル

| ファイル | 変更内容 |
|---------|---------|
| `packages/token_store/` | 新規作成 |
| `packages/oauth_client/src/index.ts` | TokenStore対応、認可フロー追加、.env保存削除、音声通知イベント、エラーログに認可URL |
| `apps/stream_orchestrator/src/index.ts` | 起動フロー変更、音声通知対応 |
| `apps/stream_orchestrator/src/spotify.ts` | コンストラクタ変更 |
| `apps/stream_orchestrator/src/nightbot.ts` | コンストラクタ変更、.env参照削除、`errorStatus` を `serverFailedToGetNightbotToken` に修正（現コードではSpotifyの値をコピペしたバグがある） |
| `apps/stream_orchestrator/src/streaming.ts` | NightbotClient生成部分変更 |
| `apps/stream_orchestrator/scripts/get_spotify_token.ts` | 削除 |
| `.env` | `*_REFRESH_TOKEN`行削除 |
| `packages/kit_models/src/...` | `serverNeedAuthorization` を `NotifyMessage` の `status` Union に追加（`ErrorMessage` ではなく `NotifyMessage` として扱う） |
| `apps/desktop_client/src/renderer/src/assets/` | 認証用WAVファイル追加 |
| `apps/desktop_client/src/renderer/src/error.ts` | `serverNeedAuthorization` の処理追加 |
