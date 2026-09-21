# アニメ拡張機能 YouTube / ニコニコ動画対応

## 概要

ブラウザ拡張機能のアニメ情報取得対象をU-NEXTに加えてYouTube・ニコニコ動画にも拡大する。
Content script をサイトごとに切り替え可能な設計にし、サイト固有のDOM構造に対応する。

## 処理の流れ

```
動画ページ（U-NEXT / YouTube / ニコニコ）
  → ブラウザ拡張機能でDOM取得
  → hubに送信
  → フロントエンドで受信・表示
```

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `apps/anime_extension/entrypoints/content.ts` | サイト別スクレイパーにリファクタリング（要変更） |
| `apps/anime_extension/entrypoints/popup/App.tsx` | デフォルト設定にYouTube/ニコニコを追加（要変更） |

### 変更しないファイル

| ファイル | 理由 |
|---------|------|
| `packages/kit_models/src/media_info.ts` | `MediaInfoMessage` は `title`/`episode`/`progress`/`duration` で汎用的 |
| `apps/anime_extension/entrypoints/background.ts` | すべての `MediaInfoMessage` を共通中継 |
| `apps/anime_extension/wxt.config.ts` | すでに `host_permissions: ["<all_urls>"]` で全サイト許可済み |
| `apps/anime_extension/models/script_setting.ts` | `ScriptSetting` は name / site / enabled / defaultOff で汎用的。変更不要 |

## Content script 設計 (`content.ts`)

### matches (WXT の URL パターン)

```typescript
matches: [
  "*://video.unext.jp/play/*",
  "*://www.youtube.com/watch*",
  "*://www.nicovideo.jp/watch/*",
],
```

`/shorts/` は対象外。YouTube Kids などの別サービスも対象外。

### アーキテクチャ

1 つの `defineContentScript` 内で `window.location.hostname` から現在のサイトを判定し、対応するスクレイパー関数を呼び出す。

```typescript
const SITE_NAME = (() => {
  if (hostname === "video.unext.jp") return "u-next";
  if (hostname === "www.youtube.com") return "youtube";
  if (hostname === "www.nicovideo.jp") return "nicovideo";
  return null;
})();

if (!SITE_NAME) return; // 想定外のページでは何もしない
```

注意: `includes` は使わず完全一致で判定する（`youtubekids.com` 等の誤検出防止）。

### サイト間遷移について

同一タブ内で異なる動画サイトを同時に開くことは想定しない。
`defineContentScript` の `main()` は1度しか呼ばれないが、ページ遷移時にcontent scriptが再実行されるため問題にならない。

### サイト別スクレイパー

スクレイパーは `extractAnimeInfo` の内部ロジックをサイトごとに切り替える。

#### U-NEXT (既存・変更なし)

| 情報 | セレクタ |
|------|---------|
| タイトル | `h2` → textContent |
| 話数 | `h3` → textContent |
| 再生位置 | `video.currentTime` |
| 全体長さ | `video.duration` |

#### YouTube

| 情報 | セレクタ |
|------|---------|
| タイトル | `document.title` → ` - YouTube` を除去 |
| 話数 | 空文字（なし） |
| 再生位置 | `video.currentTime` |
| 全体長さ | `video.duration` |

詳細:
- タイトル: `document.title.replace(/ - YouTube$/, '')` で取得（フォールバックなし）
- 話数: 常に空文字 `""`（タイトルに `第X話` 等が含まれていても現状は抽出しない）
- 動画要素: `document.querySelector('video')` で直接取得

#### ニコニコ動画

| 情報 | セレクタ |
|------|---------|
| タイトル | `document.title` → ` - ニコニコ動画` を除去 |
| 話数 | 空文字（なし） |
| 再生位置 | `video.currentTime` |
| 全体長さ | `video.duration` |

### エラーハンドリング

各サイトの `extractAnimeInfo` で必要な DOM 要素が見つからなかった場合、リトライせず即座に `null` を返す。

```
if (!video) return null;         // YouTube/ニコニコ
if (!h2 || !h3 || !video) return null; // U-NEXT
```

### episode ガードの緩和

既存のU-NEXT実装では下記のガードで `episode` の空文字を弾いていたが、YouTube/ニコニコでは話数が取得できないため空文字になる。
以下のように `!episode` のチェックを削除する。

```
// 変更前
if (!title || !episode || Number.isNaN(duration)) return null;

// 変更後
if (!title || Number.isNaN(duration)) return null;
```

### syncState / 設定の紐付け

`syncState` は検出された `SITE_NAME` を使って `chrome.storage.local` の設定をチェックする。

```
const settings = await chrome.storage.local.get(SCRIPT_SETTINGS_KEY);
const setting = settings.find((s: ScriptSetting) => s.name === SITE_NAME);

if (setting?.enabled) {
  if (hasSyncedOnce || !setting.defaultOff) {
    startWatching();
  } else {
    stopWatching();
  }
} else {
  stopWatching();
}
```

`defaultOff` の意味:
- `defaultOff=true`: 初回同期時のみ `enabled` の値に関わらず情報取得を行わない。
- `defaultOff=false`: 初回同期時から `enabled` の値で情報取得するかどうかを判断する。

`hasSyncedOnce`:
- 初回同期後に `true` になる。
- 2回目以降の同期では `defaultOff` を無視し、`enabled` のみで判定する。

### 取得間隔

全サイト共通で `CHECK_INTERVAL = 100ms` とする。

### 状態管理

`lastTitle`, `lastEpisode`, `lastProgress` はグローバル変数で管理（変更なし）。
`hasChanged` は `Math.abs(info.progress - lastProgress) > 0` で判定し、最初のフレーム（progress=0）も変化として検出する（意図通り）。

## ポップアップUI 変更 (`App.tsx`)

`DEFAULT_SCRIPT_SETTINGS` に YouTube / ニコニコを追加する。

```typescript
const DEFAULT_SCRIPT_SETTINGS: ScriptSetting[] = [
  {
    name: "u-next",
    site: "https://video.u-next.play.jp/play/",
    enabled: false,
    defaultOff: true,
  },
  {
    name: "youtube",
    site: "https://www.youtube.com/",
    enabled: false,
    defaultOff: true,
  },
  {
    name: "nicovideo",
    site: "https://www.nicovideo.jp/",
    enabled: false,
    defaultOff: true,
  },
];
```

ポップアップのレンダリングは `settings.map()` で動的に行っているため、`DEFAULT_SCRIPT_SETTINGS` の変更のみでUIに自動反映される。

## メッセージ型 (`kit_models`)

`MediaInfoMessage` の `episode` は話数がないサイトでは `""`（空文字）を送信する。
ビューアー側はすでに `animeInfo?.episode || ""` と空文字ガード済み。
アニメ/音楽を `kind` で判別する。アニメ固有の話数以外の音楽フィールドは拡張時に空文字で埋める。

```typescript
interface MediaInfoMessage {
  type: "mediaInfo";
  kind: "anime" | "music";
  title: string;
  episode: string;   // 取得できないサイト・音楽は空文字
  progress: number;  // 秒数
  duration: number;  // 秒数
  artist: string;    // アニメは空文字
  album: string;     // アニメは空文字
  artworkUrl: string; // アニメは空文字
  uri: string;       // アニメは空文字
  playbackStatus: "Playing" | "Paused" | "Stopped"; // アニメは "Playing"
}
```

## 実装手順

1. `content.ts` をリファクタリング
   - URL matches に YouTube / ニコニコを追加
   - `SITE_NAME` 判定ロジックを追加（`includes` → `===` に厳格化）
   - `extractAnimeInfo` をサイトごとに分岐
   - episodeガードから `!episode` を削除
   - `syncState` に `defaultOff` 判定ロジックを追加
   - YouTube 用 `document.querySelector('video')` で動画要素を取得
   - ニコニコ用のセレクタを追加
2. `App.tsx` の `DEFAULT_SCRIPT_SETTINGS` に2サイト追加
3. `npm run compile` で型チェック通過を確認


