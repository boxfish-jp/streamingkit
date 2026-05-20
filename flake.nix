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
      ...
    }:
    let
      mkPackage =
        pkgs:
        pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "streaming-kit-cli";
          version = "1.0.1";
          src = cli-src;
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
            export NODE_PATH="${placeholder "out"}/lib/streaming-kit-cli/node_modules"
            exec "$NODE_BIN" "${placeholder "out"}/lib/streaming-kit-cli/apps/cli/dist/index.js" "\$@"
            EOF
            chmod +x $out/bin/$pname
            runHook postInstall
          '';
          meta = {
            description = "配信ツールのCLI";
            license = pkgs.lib.licenses.mit;
          };
        });
    in
    flake-utils.lib.eachDefaultSystem (system: {
      packages.default = mkPackage nixpkgs.legacyPackages.${system};
    })
    // {
      homeManagerModules.default =
        {
          config,
          pkgs,
          lib,
          ...
        }:
        let
          cfg = config.programs.streaming-kit-cli;
          cliPkg = self.packages.${pkgs.system}.default;
          cliBin = "${lib.getBin cfg.package}/bin/streaming-kit-cli";

          systemdExec =
            let
              workDirExpanded =
                if lib.hasPrefix "~" cfg.workDir then "%h${lib.removePrefix "~" cfg.workDir}" else cfg.workDir;
            in
            "${cliBin} run ${lib.escapeShellArg workDirExpanded} ${lib.escapeShellArg cfg.serverUrl}";
        in
        {
          options.programs.streaming-kit-cli = {
            enable = lib.mkEnableOption "streaming-kit-cli";

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
    };
}
