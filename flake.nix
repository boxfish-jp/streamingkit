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
        url = "https://github.com/boxfish-jp/streamingkit/releases/download/v1.0.1/app-ubuntu-latest.tar.gz";
        sha256 = "sha256-UPgVP/gFD1Bbqd55zEXhqlyRCM+07ZeO2lgM8f/L08M=";
      };
      cli =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "cli";
          version = "1.0.1";

          src = pkgs.fetchFromGitHub {
            owner = "boxfish-jp";
            repo = "streamingkit";
            rev = "v1.0.1";
            hash = "sha256-fpNKfAn9sTNWQL8tYDaWj9E68+OeFVSnFdhv+Vyyems=";
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
            hash = "sha256-HVPjujAtCyYjSDcOICyvac3oDWqbNCVcvg3IdUsPg5o=";
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
          version = "1.0.1";
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
          version = "1.0.1";

          src = pkgs.fetchFromGitHub {
            owner = "boxfish-jp";
            repo = "streamingkit";
            rev = "v1.0.1";
            hash = "sha256-fpNKfAn9sTNWQL8tYDaWj9E68+OeFVSnFdhv+Vyyems=";
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
            hash = "sha256-HVPjujAtCyYjSDcOICyvac3oDWqbNCVcvg3IdUsPg5o=";
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
            mkdir -p $out/lib/$pname/apps/hub/static
            cp -r apps/effect/dist/* $out/lib/$pname/apps/hub/static/
            cp -r apps/todo_viewer/dist/* $out/lib/$pname/apps/hub/static/
            mkdir -p $out/bin

            NODE_BIN="${pkgs.nodejs_24}/bin/node"

            cat > $out/bin/$pname <<EOF
            #!/usr/bin/env bash
            set -euo pipefail
            export NODE_PATH="${placeholder "out"}/lib/hub/node_modules"
            exec "$NODE_BIN" "${placeholder "out"}/lib/hub/apps/hub/dist/index.js" "\$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのWebSocketハブサーバー";
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
      homeManagerModules.streaming-kit-cli =
        {
          config,
          pkgs,
          lib,
          ...
        }:
        let
          cfg = config.programs.streaming-kit-cli;
          cliPkg = self.packages.${pkgs.system}.cli;
          cliBin = "${lib.getBin cfg.package}/bin/cli";

          systemdExec =
            let
              workDirExpanded =
                if lib.hasPrefix "~" cfg.workDir then "%h${lib.removePrefix "~" cfg.workDir}" else cfg.workDir;
            in
            "${cliBin} run ${lib.escapeShellArg workDirExpanded} ${lib.escapeShellArg cfg.serverUrl}";
        in
        {
          options.programs.streaming-kit-cli = {
            enable = lib.mkEnableOption "cli";

            package = lib.mkOption {
              type = lib.types.package;
              default = cliPkg;
              description = "使用する streaming-kit-cli パッケージ。";
            };

            workDir = lib.mkOption {
              type = lib.types.str;
              default = "~/dev";
              example = "/home/user/projects/streaming";
              description = "作業ディレクトリ（systemd 実行時の第1引数）。";
            };

            serverUrl = lib.mkOption {
              type = lib.types.str;
              default = "http://192.168.68.11:8888";
              example = "http://localhost:8080";
              description = "サーバーのURL（systemd 実行時の第2引数）。";
            };

            systemd.enable = lib.mkOption {
              type = lib.types.bool;
              default = false;
              description = "systemd ユーザーサービスとして自動起動する。";
            };

            systemd.serviceName = lib.mkOption {
              type = lib.types.str;
              default = "streaming-kit-cli";
              description = "systemd サービス名。";
            };
          };

          config = lib.mkIf cfg.enable {
            home.packages = [ cfg.package ];

            systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
              Unit = {
                Description = "Streaming Kit CLI Service";
                After = [ "network.target" ];
                Wants = [ "network-online.target" ];
              };
              Service = {
                Type = "simple";
                ExecStart = systemdExec;
                Restart = "on-failure";
                RestartSec = "5s";
                WorkingDirectory = "%h";
              };
              Install.WantedBy = [ "default.target" ];
            };
          };
        };
      homeManagerModules.streaming-kit-desktop =
        {
          config,
          pkgs,
          lib,
          ...
        }:
        let
          cfg = config.programs.streaming-kit-desktop;
          desktopPkg = self.packages.${pkgs.system}.desktop;
          desktopBin = "${lib.getBin cfg.package}/bin/desktop";

          systemdExec = desktopBin;
        in
        {
          options.programs.streaming-kit-desktop = {
            enable = lib.mkEnableOption "desktop";

            package = lib.mkOption {
              type = lib.types.package;
              default = desktopPkg;
              description = "使用する streaming-kit-desktop パッケージ。";
            };

            systemd.enable = lib.mkOption {
              type = lib.types.bool;
              default = false;
              description = "systemd ユーザーサービスとして自動起動する。";
            };

            systemd.serviceName = lib.mkOption {
              type = lib.types.str;
              default = "streaming-kit-desktop";
              description = "systemd サービス名。";
            };
          };

          config = lib.mkIf cfg.enable {
            home.packages = [ cfg.package ];

            systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
              Unit = {
                Description = "Streaming Kit Desktop App Service";
                After = [ "network.target" ];
                Wants = [ "network-online.target" ];
              };
              Service = {
                Type = "simple";
                ExecStart = systemdExec;
                Restart = "on-failure";
                RestartSec = "5s";
                WorkingDirectory = "%h";
              };
              Install.WantedBy = [ "default.target" ];
            };
          };
        };
      homeManagerModules.streaming-kit-hub =
        {
          config,
          pkgs,
          lib,
          ...
        }:
        let
          cfg = config.programs.streaming-kit-hub;
          hubPkg = self.packages.${pkgs.system}.hub;
          hubBin = "${lib.getBin cfg.package}/bin/hub";
        in
        {
          options.programs.streaming-kit-hub = {
            enable = lib.mkEnableOption "hub";

            package = lib.mkOption {
              type = lib.types.package;
              default = hubPkg;
              description = "使用する streaming-kit-hub パッケージ。";
            };

            systemd.enable = lib.mkOption {
              type = lib.types.bool;
              default = false;
              description = "systemd ユーザーサービスとして自動起動する。";
            };

            systemd.serviceName = lib.mkOption {
              type = lib.types.str;
              default = "streaming-kit-hub";
              description = "systemd サービス名。";
            };
          };

          config = lib.mkIf cfg.enable {
            home.packages = [ cfg.package ];

            systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
              Unit = {
                Description = "Streaming Kit Hub Server";
                After = [ "network.target" ];
                Wants = [ "network-online.target" ];
              };
              Service = {
                Type = "simple";
                ExecStart = hubBin;
                Restart = "on-failure";
                RestartSec = "5s";
                WorkingDirectory = "%h";
              };
              Install.WantedBy = [ "default.target" ];
            };
          };
        };
    };
}
