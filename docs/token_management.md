# OAuth Token Management 計画

## 現状の課題

1. **初期トークン取得が手動** - Spotify用スクリプトは`CLIENT_ID`が空で手動入力が必要、Nightbotは完全手動
2. **トークン保存が`.env`** - Nightbotのみ`.env`に自動保存、Spotifyは保存されない（refresh tokenローテ時に再起動で消える）
3. **DBが存在しない** - ファイルベースの管理

## 方針

- **CLIENT_ID, CLIENT_SECRET** → `.env`のまま（不変なので）
- **REFRESH_TOKEN, ACCESS_TOKEN, EXPIRES_AT** → SQLite DBで管理
- **初回起動時**にDBにトークンがなければ、自動的にブラウザで認可フローを開始
- `.env`から`*_REFRESH_TOKEN`行を削除

## 構成

### 1. `packages/token_store` 新規作成

- `better-sqlite3` を使用
- スキーマ:

```sql
CREATE TABLE oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL
);
```

### 2. `packages/oauth_client` 改修

- `TokenStore` interfaceを追加（`getToken(provider)`, `saveToken(provider, tokens)`）
- `saveSetting`（.env保存）を削除 → `tokenStore`に置き換え
- **認可コードフロー**メソッド`_runAuthorizationFlow()`を追加:
  - ローカルHTTPサーバー起動 → ブラウザ自動オープン → code取得 → token交換 → DB保存
- `OauthClient`のコンストラクタに`tokenStore`, `provider`, `authConfig`（認可URL等）を渡す

### 3. `apps/stream_orchestrator` 修正

- 起動フロー:
  1. `TokenStore`初期化
  2. DBからトークン取得を試みる
  3. **トークンなし** → 自動で認可フロー開始（Spotify → Nightbotの順）
  4. **トークンあり** → そのまま`OauthClient`開始
- `.env`からは`CLIENT_ID`/`CLIENT_SECRET`のみ読み込み
- `scripts/get_spotify_token.ts` は削除

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
| `packages/oauth_client/src/index.ts` | TokenStore対応、認可フロー追加、.env保存削除 |
| `apps/stream_orchestrator/src/index.ts` | 起動フロー変更 |
| `apps/stream_orchestrator/src/spotify.ts` | コンストラクタ変更 |
| `apps/stream_orchestrator/src/nightbot.ts` | コンストラクタ変更、.env参照削除 |
| `apps/stream_orchestrator/src/streaming.ts` | NightbotClient生成部分変更 |
| `apps/stream_orchestrator/scripts/get_spotify_token.ts` | 削除 |
| `.env` | `*_REFRESH_TOKEN`行削除 |
