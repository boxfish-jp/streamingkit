{ self }:
{
  streaming-kit-cli =
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

  streaming-kit-desktop =
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

  streaming-kit-hub =
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

  streaming-kit-voicevox-connector =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      cfg = config.programs.streaming-kit-voicevox-connector;
      voicevoxConnectorPkg = self.packages.${pkgs.system}.voicevox_connector;
      voicevoxConnectorBin = "${lib.getBin cfg.package}/bin/voicevox_connector";
    in
    {
      options.programs.streaming-kit-voicevox-connector = {
        enable = lib.mkEnableOption "voicevox_connector";

        package = lib.mkOption {
          type = lib.types.package;
          default = voicevoxConnectorPkg;
          description = "使用する streaming-kit-voicevox-connector パッケージ。";
        };

        systemd.enable = lib.mkOption {
          type = lib.types.bool;
          default = false;
          description = "systemd ユーザーサービスとして自動起動する。";
        };

        systemd.serviceName = lib.mkOption {
          type = lib.types.str;
          default = "streaming-kit-voicevox-connector";
          description = "systemd サービス名。";
        };
      };

      config = lib.mkIf cfg.enable {
        home.packages = [ cfg.package ];

        systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
          Unit = {
            Description = "Streaming Kit VoiceVox Connector";
            After = [ "network.target" ];
            Wants = [ "network-online.target" ];
          };
          Service = {
            Type = "simple";
            ExecStart = voicevoxConnectorBin;
            Restart = "on-failure";
            RestartSec = "5s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "default.target" ];
        };
      };
    };
}
