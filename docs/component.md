# OAuth Client 設計

## OauthClient のコンストラクタ

`OauthClient` は以下の3つを受け取る：

- **`tokenStore`** — `packages/token_store` のインターフェース。`getToken(provider)` / `saveToken(provider, tokens)` を持つ。**外部からコンストラクタで注入**する
- **`provider`** — `"spotify"` や `"nightbot"` といったプロバイダー識別子（DBの `provider` カラムに対応）。**各プロバイダークラス内でハードコード**
- **`authConfig`** — 認可フロー用の設定（認可エンドポイントURL、スコープ、callback port等）。**各プロバイダークラス内でハードコード**

## provider と authConfig の保存場所

`provider` と `authConfig` はプロバイダー固有の**不変情報**なので、各プロバイダークラス（`spotify.ts`, `nightbot.ts`）内で**ハードコード**する。

理由：
- プロバイダー識別子（`"spotify"`, `"nightbot"`）や認可エンドポイント、スコープはプロバイダーが変わらない限り変わらない
- 現状でも `endpoint` は各クラスでハードコードされている
- AGENTS.mdの「Hookとロジックの結合」原則に従い、そのクラスでしか使わない設定は同じファイルに置く

## tokenStore の受け取り方

`tokenStore` は**コンストラクタで外部から注入**する。

理由：
- `stream_orchestrator` が1つの `tokenStore` インスタンスを作成し、`SpotifyClient` と `NightbotClient` の両方に渡せる
- テスト時にモックを注入しやすい
- ライフサイクル管理を呼び出し元で制御できる
- DBパスなどの設定を `tokenStore` 側で管理でき、クライアント側が知る必要がない

### 例

```typescript
// spotify.ts
export class SpotifyClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, tokenStore: TokenStore) {
    const authConfig = {
      authorizeEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
      scopes: ["user-read-playback-state", "user-modify-playback-state"],
      callbackPort: 5000,
    };
    
    super({
      tokenStore,
      provider: "spotify",
      authConfig,
      // ...
    });
  }
}
```

## データの保存場所まとめ

| 情報 | 保存場所 |
|------|---------|
| `CLIENT_ID`, `CLIENT_SECRET` | `.env` |
| `REFRESH_TOKEN`, `ACCESS_TOKEN`, `EXPIRES_AT` | SQLite DB (`tokenStore`) |
| `authConfig`（認可URL、スコープ等） | コード内定数（各プロバイダークラス） |

## TokenStore のインターフェースとコンストラクタ

### インターフェース

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

### コンストラクタ

```typescript
constructor(dbPath: string)
```

- `dbPath` — SQLite DBファイルのパス。`better-sqlite3` で開き、テーブルがなければ作成する
- 呼び出し元（`stream_orchestrator`）が1つのインスタンスを作成し、`SpotifyClient` と `NightbotClient` の両方に渡す

### 使用例

```typescript
// stream_orchestrator/src/index.ts
const tokenStore = new SqliteTokenStore("./data/tokens.db");
const spotifyClient = new SpotifyClient(clientId, clientSecret, tokenStore);
const nightbotClient = new NightbotClient(clientId, clientSecret, tokenStore);
```

## インターフェース定義

### 共通部分（OauthClient）

```typescript
export interface IOauthClient {
  getAccessToken(): string | null;
  isTokenValid(): boolean;
  start(): Promise<void>;
  readonly headers: HeadersInit;
}
```

### SpotifyClient

```typescript
export interface ISpotifyClient extends IOauthClient {
  addQueue(trackUri: string): Promise<void>;
}
```

### NightbotClient

```typescript
export interface INightbotClient extends IOauthClient {
  sendComment(message: string): Promise<void>;
}
```

### 設計方針

- `getAccessToken()`, `isTokenValid()` は基底クラス `OauthClient` に移動
- 各プロバイダークラスは固有のビジネスロジックメソッドのみを持つ
- `SpotifyClient`: `addQueue()` - Spotifyの再生キューに曲を追加
- `NightbotClient`: `sendComment()` - Nightbot経由でコメントを投稿

## トークン保存のタイミング

`_tokenRefresh()` の成功時、毎refresh後に `tokenStore.saveToken()` を呼ぶ。

- refresh_tokenがレスポンスに含まれていれば新しい値で保存
- 含まれていなければ既存のrefresh_token + 新しいexpires_atで保存
- プロバイダーによる分岐は不要（両方とも同じロジックで対応できる）

背景:
- **Nightbot**: 毎refreshでrefresh_tokenがローテートするため、毎回の保存が必須
- **Spotify**: refresh_tokenは毎回返されるとは限らないが、expires_atの更新のため毎refresh保存で問題ない

## 認可フロー

### 概要

初回起動時やトークン無効時に、ブラウザで認可を行ってもらうフロー。

### 仕組み

1. `node:http` で `localhost:5000` に一時的なHTTPサーバーを起動
2. ターミナルに認可URLを出力
3. ユーザーがブラウザで認可 → `http://localhost:5000/callback?code=xxx` にリダイレクト
4. `code` を受け取ったらサーバー閉じる（`server.close()`）
5. `code` → token交換 → `tokenStore.saveToken()` でDB保存

### ポート

- `callbackPort: 5000` 固定で使い回し
- Spotify → Nightbot の順に認可フローを実行する場合、同じポートで順次起動・停止

### 音声通知

認証が必要な場合、`OauthClient` は `onMessage` イベントを発行：

```typescript
this.emit("onMessage", {
  type: "notify",
  status: "serverNeedAuthorization",
  time: Date.now(),
  message: "Spotifyの認証が必要です",
});
```

呼び出し元（`stream_orchestrator`）がこれを受けて `SynthesizeRunner` に投入 → 音声が流れる。

### トークンエラー時の認可フロー再トリガー

トークンが無効（401 Unauthorized等）の場合、以下の処理を行う：

1. `console.error` に認可URLを出力（クリックまたはコピペでブラウザで開けるURL形式）：

```typescript
console.error(
  `トークンが無効です。以下のURLで再認可してください：\n${this._buildAuthorizationUrl()}`
);
```

2. `setInterval` で60秒ごとに `serverNeedAuthorization` の音声通知を繰り返しemitする：

```typescript
this._notifyTimer = setInterval(() => {
  this.emit("onMessage", {
    type: "notify",
    status: "serverNeedAuthorization",
    time: Date.now(),
    message: "Spotifyの認証が必要です",
  });
}, 60 * 1000);
```

3. ユーザーがブラウザで認可 → コールバック受信 → token交換 → DB保存 → `clearInterval` でタイマー解除 → refreshサイクル再開

`_buildAuthorizationUrl()` は `authConfig` と `clientId` から認可URLを生成するプライベートメソッド。
