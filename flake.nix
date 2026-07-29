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
        version = "v1.0.12";
        desktopSrc = fetchTarball {
          url = "https://github.com/boxfish-jp/streamingkit/releases/download/${version}/app-ubuntu-latest.tar.gz";
          sha256 = "sha256:0agkg1614vx6nyppwqzdvpr8x5428s3s52zx7z5j22q36ff2xh2x";
        };
        src = pkgs.fetchFromGitHub {
          owner = "boxfish-jp";
          repo = "streamingkit";
          rev = version;
          hash = "sha256-3cAQWfrAP6Zp9EzF1LyKyCtmI1Oc0ajHX7NgEXLIWwg=";
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
