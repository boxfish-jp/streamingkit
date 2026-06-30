{
  description = "配信ツール";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    let
      desktopSrc = builtins.fetchTarball {
        url = "https://github.com/boxfish-jp/streamingkit/releases/download/v1.0.3/app-ubuntu-latest.tar.gz";
        sha256 = "1h1swx3yad3hjfphh5651bl6nba0hn7ignn2yjgcbj958pdbrd8r";
      };
      cli =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "cli";
          version = "1.0.3";

          src = pkgs.fetchFromGitHub {
            owner = "boxfish-jp";
            repo = "streamingkit";
            rev = "v1.0.3";
            hash = "sha256-4MZHE1g7Fh9r5hjqnHK0TP4I79A4hMlRJb3Km9qrPyk=";
          };
          nativeBuildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm_9
            pkgs.pnpmConfigHook
            pkgs.turbo
          ];
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 3;
            hash = "sha256-1fdaNDP1cxYrWS0mq/NtmIljrhGj1kd+cwEi3CpHrSc=";
            pnpm = pkgs.pnpm_9;
          };
          buildPhase = ''
            runHook preBuild
            turbo prune cli --docker
            mkdir pruned && cd pruned
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

            NODE_BIN="${pkgs.nodejs_24}/bin/node"

            cat > $out/bin/$pname <<EOF
            #!/usr/bin/env bash
            set -euo pipefail
            export NODE_PATH="${placeholder "out"}/lib/cli/node_modules"
            exec "$NODE_BIN" "${placeholder "out"}/lib/cli/apps/cli/dist/index.js" "\$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのCLI";
            license = pkgs.lib.licenses.mit;
          };
        });

      desktop =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "desktop";
          version = "1.0.3";
          src = desktopSrc;
          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/$pname
            cp -a . $out/lib/$pname
            mkdir -p $out/bin

            cat > $out/bin/$pname <<EOF
            #!/usr/bin/env bash
            set -euo pipefail
            exec "${pkgs.lib.getExe pkgs.appimage-run}" "${desktopSrc}/desktop_client-1.0.0.AppImage" "\$@"

            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのデスクトップアプリ";
            license = pkgs.lib.licenses.mit;
          };
        });

      hub =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "hub";
          version = "1.0.3";

          src = pkgs.fetchFromGitHub {
            owner = "boxfish-jp";
            repo = "streamingkit";
            rev = "v1.0.3";
            hash = "sha256-4MZHE1g7Fh9r5hjqnHK0TP4I79A4hMlRJb3Km9qrPyk=";
          };
          nativeBuildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm_9
            pkgs.pnpmConfigHook
            pkgs.turbo
          ];
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 3;
            hash = "sha256-1fdaNDP1cxYrWS0mq/NtmIljrhGj1kd+cwEi3CpHrSc=";
            pnpm = pkgs.pnpm_9;
          };
          buildPhase = ''
            runHook preBuild
            turbo build --filter=hub --filter=effect --filter=todo_viewer --filter=anime_viewer
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/$pname
            cp -a . $out/lib/$pname
            mkdir -p $out/lib/$pname/apps/hub/static
            mkdir -p $out/lib/$pname/apps/hub/video
            cp -r apps/effect/dist/* $out/lib/$pname/apps/hub/static/
            cp -r apps/todo_viewer/dist/* $out/lib/$pname/apps/hub/static/
            cp -r apps/anime_viewer/dist/* $out/lib/$pname/apps/hub/static/
            cp -r $out/lib/hub/video/* $out/lib/$pname/apps/hub/video/
            mkdir -p $out/bin

            NODE_BIN="${pkgs.nodejs_24}/bin/node"

            cat > $out/bin/$pname <<EOF
            #!/usr/bin/env bash
            set -euo pipefail
            export NODE_PATH="${placeholder "out"}/lib/hub/node_modules"
            cd "${placeholder "out"}/lib/hub/apps/hub/"
            exec "$NODE_BIN" "./dist/index.js" "\$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのWebSocketハブサーバー";
            license = pkgs.lib.licenses.mit;
          };
        });

      voicevox_connector =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "voicevox_connector";
          version = "1.0.3";

          src = pkgs.fetchFromGitHub {
            owner = "boxfish-jp";
            repo = "streamingkit";
            rev = "v1.0.3";
            hash = "sha256-4MZHE1g7Fh9r5hjqnHK0TP4I79A4hMlRJb3Km9qrPyk=";
          };
          nativeBuildInputs = [
            pkgs.nodejs_24
            pkgs.pnpm_9
            pkgs.pnpmConfigHook
            pkgs.turbo
          ];
          buildInputs = [
            pkgs.alsa-lib
          ];
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 3;
            hash = "sha256-1fdaNDP1cxYrWS0mq/NtmIljrhGj1kd+cwEi3CpHrSc=";
            pnpm = pkgs.pnpm_9;
          };
          buildPhase = ''
            runHook preBuild
            turbo build
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p $out/lib/$pname
            cp -a . $out/lib/$pname
            mkdir -p $out/bin

            NODE_BIN="${pkgs.nodejs_24}/bin/node"

            cat > $out/bin/$pname <<EOF
            #!/usr/bin/env bash
            set -euo pipefail
            export NODE_PATH="${placeholder "out"}/lib/voicevox_connector/node_modules"
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.alsa-lib ]}"
            exec "$NODE_BIN" "${placeholder "out"}/lib/voicevox_connector/apps/voicevox_connector/dist/index.js" "\$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのVOICEVOX TTSコネクタ";
            license = pkgs.lib.licenses.mit;
          };
        });
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        formatter = pkgs.nixfmt-tree;
        packages.default = cli pkgs;
        packages.cli = cli pkgs;
        packages.desktop = desktop pkgs;
        packages.hub = hub pkgs;
        packages.voicevox_connector = voicevox_connector pkgs;

        devShells.default =
          let
            fhs = pkgs.buildFHSEnv {
              name = "dev";
              targetPkgs =
                pkgs: with pkgs; [
                  nodejs_24
                  pnpm_9
                  turbo
                  typescript-language-server
                ];
              runScript = "bash";
            };
          in
          pkgs.mkShell {
            packages = [ fhs ];
            shellHook = ''
              exec ${fhs}/bin/dev
            '';
          };
      }
    )
    // {
      homeManagerModules = import ./nix/home-modules.nix { inherit self; };
    };
}
