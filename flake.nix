{
  description = "配信ツールのCLI";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    cli-src = {
      url = "github:boxfish-jp/streamingkit?ref=v1.0.1";
      flake = false;
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      cli-src,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pnpm9 = pkgs.pnpm_9; # pnpm-lock.yaml v9 用
      in
      {
        packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "streaming-kit-cli";
          version = "0.1.0";
          src = cli-src;

          nativeBuildInputs = [
            pkgs.nodejs_20
            pkgs.pnpm_9
            pkgs.pnpmConfigHook
            pkgs.turbo
          ];

          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 3;
            hash = "sha256-HVPjujAtCyYjSDcOICyvac3oDWqbNCVcvg3IdUsPg5o=";
            pnpm = pnpm9;
          };

          # ビルドフェーズ
          buildPhase = ''
            runHook preBuild
            turbo prune cli --docker
            mkdir pruned
            cd pruned
            cp -r ../out/json/. .
            pnpm install --frozen-lockfile
            cp -r ../out/full/. .
            cp ../tsconfig.package-build.json ./
            cp ../tsconfig.develop.json ./
            turbo build 
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/$pname
            cp -a . $out/lib/$pname
            mkdir -p $out/bin
            cat > $out/bin/$pname <<'EOF'
            #!/usr/bin/env bash
            set -euo pipefail
            export NODE_PATH="${placeholder "out"}/lib/streaming-kit-cli/node_modules"
            exec node "${placeholder "out"}/lib/streaming-kit-cli/apps/cli/dist/index.js" "run" "~/dev" "http://192.168.68.11:8888" "$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';

          meta = {
            description = "配信ツールのCLI";
            license = pkgs.lib.licenses.mit;
          };
        });
      }
    );
}
