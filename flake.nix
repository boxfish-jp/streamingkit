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
        version = "v1.0.13";
        desktopSrc = fetchTarball {
          url = "https://github.com/boxfish-jp/streamingkit/releases/download/${version}/app-ubuntu-latest.tar.gz";
          sha256 = "sha256:0pgp52m51z0ic649qymfzm3qamvly8w7raz791l8nyph9iccwp31";
        };
        src = pkgs.fetchFromGitHub {
          owner = "boxfish-jp";
          repo = "streamingkit";
          rev = version;
          hash = "sha256-54sWyT2EmSKwF8ksTL2N2b7AOC8jaXs3XkLlMiGGlpU=";
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
