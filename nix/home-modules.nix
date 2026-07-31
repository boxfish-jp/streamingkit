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
            After = [
              "graphical-session.target"
              "network.target"
            ];
            Wants = [
              "graphical-session.target"
              "network-online.target"
            ];
          };
          Service = {
            Type = "simple";
            ExecStart = systemdExec;
            TimeoutStartSec = "15s";
            Restart = "on-failure";
            RestartSec = "30s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "graphical-session.target" ];
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
            After = [
              "graphical-session.target"
              "network.target"
            ];
            Wants = [
              "graphical-session.target"
              "network-online.target"
            ];
          };
          Service = {
            Type = "simple";
            ExecStart = systemdExec;
            TimeoutStartSec = "15s";
            Restart = "on-failure";
            RestartSec = "30s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "graphical-session.target" ];
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
            After = [
              "graphical-session.target"
              "network.target"
            ];
            Wants = [
              "graphical-session.target"
              "network-online.target"
            ];
          };
          Service = {
            Type = "simple";
            ExecStart = hubBin;
            TimeoutStartSec = "15s";
            Restart = "on-failure";
            RestartSec = "30s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "graphical-session.target" ];
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

        voicevoxUrls = lib.mkOption {
          type = lib.types.str;
          default = "http://127.0.0.1:50021";
          description = "VoiceVox サーバーのURL（カンマ区切り、前方優先）。";
        };

        pingIntervalMs = lib.mkOption {
          type = lib.types.ints.positive;
          default = 30000;
          description = "ヘルスチェック ping の間隔（ミリ秒）。";
        };
      };

      config = lib.mkIf cfg.enable {
        home.packages = [ cfg.package ];

        systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
          Unit = {
            Description = "Streaming Kit VoiceVox Connector";
            After = [
              "graphical-session.target"
              "network.target"
            ];
            Wants = [
              "graphical-session.target"
              "network-online.target"
            ];
          };
          Service = {
            Type = "simple";
            ExecStart = voicevoxConnectorBin;
            Environment = [
              "VOICEVOX_URLS=${cfg.voicevoxUrls}"
              "VOICEVOX_PING_INTERVAL_MS=${toString cfg.pingIntervalMs}"
            ];
            TimeoutStartSec = "15s";
            Restart = "on-failure";
            RestartSec = "30s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };
      };
    };

  streaming-kit-stream-orchestrator =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      cfg = config.programs.streaming-kit-stream-orchestrator;
      streamOrchestratorPkg = self.packages.${pkgs.system}.stream_orchestrator;
      streamOrchestratorBin = "${lib.getBin cfg.package}/bin/stream_orchestrator";

      systemdExec = "${streamOrchestratorBin} ${lib.escapeShellArg cfg.hubUrl}";

      voicepeakWrapper = pkgs.writeShellScriptBin "voicepeak" ''
        export LD_LIBRARY_PATH="${pkgs.alsa-lib}/lib:${pkgs.freetype}/lib:${pkgs.curl.out}/lib''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
        cd ${dirOf cfg.voicepeakPath}
        exec ${cfg.voicepeakPath} "$@"
      '';
    in
    {
      options.programs.streaming-kit-stream-orchestrator = {
        enable = lib.mkEnableOption "stream_orchestrator";

        package = lib.mkOption {
          type = lib.types.package;
          default = streamOrchestratorPkg;
          description = "使用する streaming-kit-stream-orchestrator パッケージ。";
        };

        hubUrl = lib.mkOption {
          type = lib.types.str;
          default = "http://hub:8888";
          example = "http://localhost:8888";
          description = "ハブサーバーのURL（CLI引数）。";
        };

        tokenDbPath = lib.mkOption {
          type = lib.types.str;
          default = "/var/lib/streamingkit/tokens.db";
          example = "/var/lib/streamingkit/tokens.db";
          description = "トークンDBのパス。";
        };

        educationDbPath = lib.mkOption {
          type = lib.types.str;
          default = "/var/lib/streamingkit/education.db";
          example = "/var/lib/streamingkit/education.db";
          description = "教育DBのパス。";
        };

        niconicoUserId = lib.mkOption {
          type = lib.types.str;
          default = "98746932";
          description = "ニコニコのユーザーID。";
        };

        youtubeChannelHandle = lib.mkOption {
          type = lib.types.str;
          default = "@boxfish_jp";
          description = "YouTubeのチャンネルハンドル。";
        };

        headlessBrowserUrl = lib.mkOption {
          type = lib.types.str;
          default = "http://192.168.68.15:3000";
          description = "ニコニコヘッドレスブラウザのURL。";
        };

        voicepeakPath = lib.mkOption {
          type = lib.types.str;
          default = "/var/lib/streamingkit/voicepeak";
          description = "Voicepeak 実行ファイルのパス。";
        };

        oauthCallbackBaseUrl = lib.mkOption {
          type = lib.types.str;
          default = "http://localhost:5000";
          example = "https://example.com:8080";
          description = "OAuth コールバックのベースURL（スキーム・ホスト・ポート）。";
        };

        systemd.enable = lib.mkOption {
          type = lib.types.bool;
          default = false;
          description = "systemd ユーザーサービスとして自動起動する。";
        };

        systemd.serviceName = lib.mkOption {
          type = lib.types.str;
          default = "streaming-kit-stream-orchestrator";
          description = "systemd サービス名。";
        };
      };

      config = lib.mkIf cfg.enable {
        home.packages = [ cfg.package ];

        systemd.user.services.${cfg.systemd.serviceName} = lib.mkIf cfg.systemd.enable {
          Unit = {
            Description = "Streaming Kit Stream Orchestrator";
            After = [
              "graphical-session.target"
              "network.target"
            ];
            Wants = [
              "graphical-session.target"
              "network-online.target"
            ];
          };
          Service = {
            Type = "simple";
            ExecStart = systemdExec;
            Environment = [
              "NICONICO_USER_ID=${cfg.niconicoUserId}"
              "YOUTUBE_CHANNEL_HANDLE=${cfg.youtubeChannelHandle}"
              "TOKEN_DB_PATH=${cfg.tokenDbPath}"
              "EDUCATION_DB_PATH=${cfg.educationDbPath}"
              "NICONICO_HEADLESS_BROWSER_URL=${cfg.headlessBrowserUrl}"
              "VOICEPEAK_PATH=${voicepeakWrapper}/bin/voicepeak"
              "OAUTH_CALLBACK_BASE_URL=${cfg.oauthCallbackBaseUrl}"
            ];
            EnvironmentFile = "%h/.config/streaming-kit/.env";
            TimeoutStartSec = "15s";
            Restart = "on-failure";
            RestartSec = "30s";
            WorkingDirectory = "%h";
          };
          Install.WantedBy = [ "graphical-session.target" ];
        };
      };
    };
}
