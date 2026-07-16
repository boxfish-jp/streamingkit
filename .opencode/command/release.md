---
description: 新しいタグのリリースフローを順番に実行する。Use when 新しいタグやリリースに合わせて flake.nix を更新するとき、streamingkit のバージョンを上げるとき。
---

# リリースフロー

新しいタグのリリースフローを開始する。
以下の手順を**絶対に順番通りに**実行する。

## 手順

### 1. タグ名を決める

ユーザーに新しいタグ名（例: `v1.0.11`）を決めてもらう。
決まったら、以下の全ステップでそのタグ名を使う。

終わったらユーザーに次に進んでよいか確認する。

### 2. nix flake update

```sh
nix flake update
```

終わったらユーザーに次に進んでよいか確認する。

### 3. pnpm バージョンを package.json / release.yml に反映

```sh
nix eval --raw 'github:NixOS/nixpkgs/nixos-unstable#pnpm_11.version'
```

出力されたバージョンを以下の2ファイルに書き込む。

- `package.json` の `packageManager`
- `.github/workflows/release.yml` の `pnpm/action-setup` の `version`

pnpm の新しい世代（`pnpm_12` 等）が出ていて移行する場合は、`flake.nix` の `pnpm = pkgs.pnpm_11;` も合わせて書き換える。

終わったらユーザーに次に進んでよいか確認する。

### 4. lockfile 再生成

```sh
pnpm install
```

差分を確認させるため、ユーザーに次に進んでよいか確認する。

### 5. ソースコードのビルド確認

```sh
pnpm run build
```

終わったらユーザーに次に進んでよいか確認する。

### 6. ユーザーにコミットとタグ作成をお願いする

ステップ1で決めたタグ名を `TAG` として、以下のコマンドをユーザー自身で実行してもらうよう促す。

```sh
git add -A
git commit -m "release: TAG"
git tag TAG
git push origin TAG
```

ユーザーから完了したと聞いたら次に進む。

### 7. flake.nix の version を更新

`flake.nix` の `version` をステップ1で決めたタグ名に書き換える。

その後、以下3箇所のハッシュをダミーに置き換える。

```nix
# src (fetchFromGitHub)
hash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

# pnpmDeps (fetchPnpmDeps)
hash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

# desktopSrc (fetchTarball)
sha256 = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
```

終わったらユーザーに次に進んでよいか確認する。

### 8. ハッシュを取得する

```sh
nix build .#cli
```

`hash mismatch` のエラーに `got: sha256-...` が出たら、その値を該当の `hash` に埋める。
まず `src`、直してから再ビルドすると次に `pnpmDeps` のハッシュが出るので、それも埋める。

```sh
nix build .#desktop
```

同様に `got: sha256-...` の値を `desktopSrc` の `sha256` に埋める。

終わったらユーザーに次に進んでよいか確認する。

### 9. 全パッケージのビルド確認

```sh
nix flake check
nix build .#cli
nix build .#desktop
nix build .#hub
nix build .#voicevox_connector
```

終わったらユーザーに次に進んでよいか確認する。

### 10. ユーザーに flake.nix と flake.lock のコミットをお願いする

以下のコマンドをユーザー自身で実行してもらうよう促す。

```sh
git add flake.nix flake.lock
git commit -m "chore: update flake.nix for TAG"
```
