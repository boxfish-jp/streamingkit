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
    if [[ -z $DIRENV_IN_ENVRC ]]; then
      exec ${fhs}/bin/dev
    fi
  '';
}
