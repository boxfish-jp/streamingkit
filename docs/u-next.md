# u-nextで見ているアニメの視聴情報を送信するシステム

## 概要
u-nextで視聴中のアニメ情報をブラウザ拡張機能で取得し、hub経由でフロントエンドに表示する。

## 処理の流れ
```
u-nextページ → ブラウザ拡張機能でDOM取得 → hubに送信 → フロントエンドで受信・表示
```

## ブラウザ拡張機能 (`apps/anime_extension`)
- フレームワーク: WXT + TypeScript
- 対象URL: `video.u-next.play.jp/play/*`
- 実行場所: Content script
- DOM監視: `setInterval`で定期的に確認

### ポップアップUI
拡張機能アイコンクリックで表示されるポップアップ。

- 情報取得スクリプトのON/OFFトグルスイッチ
- デフォルトでオフにするかのチェックボックス（サイトごと、今回はu-nextのみ）
- hub接続URL入力フォーム（デフォルトは空欄）
- hub接続状態インジケータ（緑: 接続中、赤: 切断中）
- 設定は`chrome.storage.local`で永続化する

### 取得情報

| 情報 | 取得方法 |
|------|----------|
| アニメタイトル | `h2` タグの内容 |
| 話数情報 | `h3` タグの内容 |
| 再生時間 | `document.querySelector('video').currentTime` (秒数) |
| 全体の長さ | `document.querySelector('video').duration` (秒数) |

### 送信タイミング
各情報が更新される度にhubへ送信する。
`socket_client` (workspace) を使用する。

## メッセージ型 (`packages/kit_models`)
`AnimeInfoMessage` を新規追加する。

```typescript
interface AnimeInfoMessage {
  type: "animeInfo";
  title: string;
  episode: string;
  progress: number;
  duration: number;
}
```

`message.ts`, `index.ts` に追加する。

## アニメ情報表示フロントエンド (`apps/anime_viewer`)
- フレームワーク: React + Vite + TypeScript
- 参考: todo_viewer の構成
- バンドル: `vite-plugin-singlefile` で single HTML
- 装飾: 白文字 + 大きめフォント、装飾は最小限

### ページ構成

| ファイル | 内容 |
|----------|------|
| `anime-title.html` | アニメタイトル + 話数 |
| `anime-progress.html` | 再生時間 / 全体の長さ |

## Nix対応
- `flake.nix` の hub ビルドに `--filter=anime_viewer` を追加
- hub の installPhase で `apps/anime_viewer/dist/*` を `apps/hub/static/` にコピー

## hub
追加変更不要（`/static/*` で配信済み）。

## その他
- 言語はTypeScript, WXTを使ってほしい
