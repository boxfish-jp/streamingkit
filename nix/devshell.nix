{
  node,
  pnpm,
  buildFHSEnv,
  mkShell,
  turbo,
  typescript-language-server,
  nixd,
  nixfmt,
  python3,
}:

let
  fhs = buildFHSEnv {
    name = "dev";
    targetPkgs = _: [
      node
      pnpm
      turbo
      typescript-language-server
      nixd
      nixfmt
      python3
    ];
    runScript = "bash";
  };
in
mkShell {
  packages = [ fhs ];
  shellHook = ''
    exec ${fhs}/bin/dev
  '';
}
