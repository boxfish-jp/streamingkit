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
        desktopSrc = fetchTarball {
          url = "https://github.com/boxfish-jp/streamingkit/releases/download/${version}/app-ubuntu-latest.tar.gz";
          sha256 = "0lnks24r6z9xsyna0kwn9v3vwbh4pk00pd7b8jcfd178yqpfbynl";
        };
        version = "1.0.10";
        src = pkgs.fetchFromGitHub {
          owner = "boxfish-jp";
          repo = "streamingkit";
          rev = "v1.0.10";
          hash = "sha256-qEFmQZvRUa1bfxwNlh3HR9B5e/UhSKFqwmOOqvjQ3Ts=";
        };
        pnpmDeps = pkgs.fetchPnpmDeps {
          pname = "streamingkit";
          inherit version src pnpm;
          fetcherVersion = 3;
          hash = "sha256-5dBFlida3wtvn5iNckqmvCRdFOR+QaANBvDSRAHqlOg=";
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
        devShells.default = pkgs.callPackage ./nix/devshell.nix {
          inherit pnpm node;
        };
      }
    )
    // {
      homeManagerModules = import ./nix/home-modules.nix { inherit self; };
    };
}
