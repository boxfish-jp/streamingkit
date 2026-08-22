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
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        pnpm = pkgs.pnpm_11;
        node = pkgs.nodejs_24;
        version = "v1.0.17";
        desktopSrc = fetchTarball {
          url = "https://github.com/boxfish-jp/streamingkit/releases/download/${version}/app-ubuntu-latest.tar.gz";
          sha256 = "sha256:0qmkp5mzv79v99m8xj2h3m594z3h3b3nd70pq4n20zy77lc2n2di";
        };
        src = pkgs.fetchFromGitHub {
          owner = "boxfish-jp";
          repo = "streamingkit";
          rev = version;
          hash = "sha256-OVW+L6M+kEKVidgBwN6+41giLNC6Sl/PDNKdec1TdRc=";
        };
        pnpmDeps = pkgs.fetchPnpmDeps {
          pname = "streamingkit";
          inherit version src pnpm;
          fetcherVersion = 4;
          hash = "sha256-TxYL7jr9EHglvUc/LH/7HYCoDM/eDL0OGCyxJGQ5gmM=";
        };
        nativeBuildInputs = [
          pnpm
          node
          pkgs.pnpmConfigHook
          pkgs.turbo
        ];
      in
      {
        packages.default = self.packages.${system}.cli;
        formatter = pkgs.nixfmt-tree;
        packages.cli = pkgs.callPackage ./nix/cli.nix {
          inherit
            node
            version
            src
            pnpmDeps
            nativeBuildInputs
            ;
        };
        packages.desktop = pkgs.callPackage ./nix/desktop.nix {
          inherit
            version
            desktopSrc
            ;
        };
        packages.hub = pkgs.callPackage ./nix/hub.nix {
          inherit
            node
            version
            src
            pnpmDeps
            nativeBuildInputs
            ;
        };

        packages.voicevox_connector = pkgs.callPackage ./nix/voicevox_connector.nix {
          inherit
            node
            version
            src
            pnpmDeps
            nativeBuildInputs
            ;
        };

        packages.stream_orchestrator = pkgs.callPackage ./nix/stream_orchestrator.nix {
          inherit
            node
            version
            src
            pnpmDeps
            nativeBuildInputs
            ;
        };
        devShells.default = pkgs.callPackage ./nix/devshell.nix {
          inherit pnpm node;
        };
      }
    )
    // {
      homeManagerModules = import ./nix/home-modules.nix { inherit self; };
    };
}
