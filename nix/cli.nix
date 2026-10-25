{
  deps,
  lib,
  mkNodeApp,
  node,
  pnpm,
  src,
  turbo,
  version,
}:
mkNodeApp {
  pname = "cli";
  inherit
    deps
    pnpm
    src
    version
    ;
  packageManager = "pnpm";
  nodejs = node;
  nativeBuildInputs = [ turbo ];
  buildCommand = "turbo build --filter=cli";
  mainProgram = "cli";
  meta = {
    description = "配信ツールのCLI";
    license = lib.licenses.mit;
  };
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/$pname
    cp -a . $out/lib/$pname
    mkdir -p $out/bin

    cat > $out/bin/$pname <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    export NODE_PATH="${placeholder "out"}/lib/cli/node_modules"
    exec "${node}/bin/node" "${placeholder "out"}/lib/cli/apps/cli/dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
}
