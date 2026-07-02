# 時報（Time Signal）

## 何がしたい？
- 配信中に毎正時・毎半時に時刻をお知らせする。
- 音声合成（Voicepeak）で `"15時になりました"` / `"15時30分です"` のように読み上げ、システム通知用のCh4に流す。

## 要件

### タイミング
- **毎正時（mm === 0）** と **毎半時（mm === 30）** にトリガーする。
- 配信中（YouTube または NicoNico のストリームが開始している間）のみ動作する。配信終了後は時報を流さない。
- 同じ時刻の時報が重複して流れないようにする（例：15:00の時報を1回流したら、次の 15:30 までは再送しない）。
- 配信停止中は `_check()` が早期 return するため `_lastSignalKey` は保持される。
- 配信が停止→再開した場合、前回の時報 key が残っているため、**次に正時または半時が到来したときに**時報が流れる。

### 音声
- 正時: `"15時になりました"` （`{hour}時になりました`）
- 半時: `"15時30分です"` （`{hour}時{minute}分です`）
- 12時以降も0時〜11時に戻らず、そのままの時刻で読み上げる（24時間制）。
- タイムゾーンは **JST（日本時間）固定**。`Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })` で現在時刻を取得する。
- 音声チャンネルは **Ch4（システム通知用）** に出力する。

### 配信中の判定
- `streaming.ts` の `get isStreaming()` ゲッターを参照し、配信中でなければ時報をスキップする。
- `isStreaming` は NicoNico と YouTube の**OR**で判定する（どちらかが配信中なら true）。

## アーキテクチャ

### ファイル構成

| ファイル | 役割 |
|---|---|
| `apps/stream_orchestrator/src/time_signal.ts` | **新規作成** - 時報スケジューラーのロジック |
| `apps/stream_orchestrator/src/index.ts` | **修正** - `time_signal` の生成、`streaming` からの `isStreaming` 取得 |
| `apps/stream_orchestrator/src/streaming.ts` | **修正** - `get isStreaming()` ゲッターを追加（ニコニコ・YouTube のORを返す） |

### 処理フロー

```
time_signal.ts
  │
  │ setInterval(30_000) で定期チェック
  │
  ├─ streaming.isStreaming === false → スキップ
  │
  └─ streaming.isStreaming === true
       │
       ├─ mm === 0（正時）
       │   └─ 前回と同じ key（例: "15:00"）でなければ instSynthesize を emit
       │
       └─ mm === 30（半時）
           └─ 前回と同じ key（例: "15:30"）でなければ instSynthesize を emit
  │
  ▼
index.ts onMessage → instSynthesize → SynthesizeRunner → Voicepeak → synthesized → Ch4
```

### メッセージの流れ

```typescript
// time_signal.ts が発行するメッセージ
{
  type: "instSynthesize",
  content: "15時になりました", // または "15時30分です"
  channel: 4,                  // システム通知チャンネル
}
```

このメッセージは既存の `instSynthesize` ハンドラによって処理され、Voicepeak が音声合成して `synthesized` メッセージとしてデスクトップクライアントに配信される。

## 実装詳細

### TimeSignal クラス

```typescript
export class TimeSignal {
  private _lastSignalKey: string | null = null;
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private _getIsStreaming: () => boolean,
    private _onMessage: (msg: InstSynthesizeMessage) => void,
  ) {
    this._intervalId = setInterval(() => this._check(), 30_000);
  }

  private _check(): void
}
```

- `_lastSignalKey`: `"15:00"` や `"15:30"` のような文字列。同じ時刻の重複送信を防止する。
  - 配信中かつ時報対象外の分（mm !== 0 && mm !== 30）でのみ `null` にリセットする。
- _check() の内部処理順序:
  1. `isStreaming === false` → return（`_lastSignalKey` は更新しない）
  2. `mm !== 0 && mm !== 30` → `_lastSignalKey = null`（配信中のみ）
  3. `mm === 0` または `mm === 30` → `_lastSignalKey` と比較
       - 同じ key → スキップ
       - 異なる key → emit → `_lastSignalKey` を更新
- **コンストラクタ**で即座に `setInterval` を開始する（常時 polling）。
- `start()` / `stop()` は持たない。`setInterval` はアプリ生存中常時動作する。

### 設定項目
- 時報の ON/OFF 設定は持たない。常時有効で、配信中の判定は `isStreaming` に委ねる。

### 注意点

- `instSynthesize` の `channel: 4` は既存の通知WAVと同チャンネルであるため、時報TTSと通知音が同じキューで直列に再生される（排他制御は既存の `PlayAudioManager` が行う）。
- Voicepeak が起動していない場合（起動前・クラッシュ）、`SynthesizeRunner` のリトライロジックが動作する（最大5回リトライ、30秒タイムアウト）。リトライが尽きた場合、時報メッセージは破棄される（次の時刻を待つ）。
- `_check()` は完全に同期的（`await` なし）なため、ガードフラグは不要。

## 非機能要件

- 30秒間隔のチェックで十分な精度（最大30秒の遅延が許容範囲）。
- 時報のスケジューリングはオーケストレーター内で完結しており、外部依存なし。
