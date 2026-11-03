{
  description = "配信ツール";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    nix-node-build = {
      url = "github:boxfish-jp/nix-node-build";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      nix-node-build,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        pnpm = pkgs.pnpm_11;
        node = pkgs.nodejs_24;
        version = "v1.0.20";
        desktopSrc = fetchTarball {
          url = "https://github.com/boxfish-jp/streamingkit/releases/download/${version}/app-ubuntu-latest.tar.gz";
          sha256 = "sha256:15d7l7gp4g1wa1fddi694550jsp4sm5xyhlv83pajhcl5m6s6fi7";
        };
        src = pkgs.fetchFromGitHub {
          owner = "boxfish-jp";
          repo = "streamingkit";
          rev = version;
          hash = "sha256-LRfh8Co9tAxaJbj4amYp91kRYyPx2AQP3sD3FvGnu/U=";
        };
        depsHash = "sha256-15Sw3rg5fTVeLUmZpC5FORtsgK33/Y/d4rU+f4WXN1s=";
        deps = nix-node-build.lib.mkNodeDeps {
          inherit
            depsHash
            pkgs
            pnpm
            src
            ;
          packageManager = "pnpm";
        };
        mkNodeApp = args: nix-node-build.lib.mkNodeApp ({ inherit pkgs; } // args);
        mkApp =
          file:
          pkgs.callPackage file {
            inherit
              deps
              mkNodeApp
              node
              pnpm
              src
              version
              ;
          };
      in
      {
        packages.default = self.packages.${system}.cli;
        formatter = pkgs.nixfmt-tree;
        packages.cli = mkApp ./nix/cli.nix;
        packages.desktop = pkgs.callPackage ./nix/desktop.nix {
          inherit
            version
            desktopSrc
            ;
        };
        packages.hub = mkApp ./nix/hub.nix;
        packages.voicevox_connector = mkApp ./nix/voicevox_connector.nix;
        packages.stream_orchestrator = mkApp ./nix/stream_orchestrator.nix;
        devShells.default = pkgs.callPackage ./nix/devshell.nix {
          inherit pnpm node;
        };
      }
    )
    // {
      homeManagerModules = import ./nix/home-modules.nix { inherit self; };
    };
}
