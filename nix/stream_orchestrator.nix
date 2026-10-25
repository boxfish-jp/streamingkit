{
  deps,
  lib,
  mkNodeApp,
  node,
  node-gyp,
  pnpm,
  python3,
  src,
  turbo,
  version,
}:
mkNodeApp {
  pname = "stream_orchestrator";
  inherit
    deps
    pnpm
    src
    version
    ;
  packageManager = "pnpm";
  nodejs = node;
  nativeBuildInputs = [
    node-gyp
    python3
    turbo
  ];
  preBuild = ''
    for sqliteDir in node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3; do
      (
        cd "$sqliteDir"
        node-gyp rebuild --release --nodedir=${node}
      )
    done
  '';
  buildCommand = "turbo build --filter=stream_orchestrator";
  mainProgram = "stream_orchestrator";
  meta = {
    description = "配信ツールのストリームオーケストレーター";
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
    export NODE_PATH="${placeholder "out"}/lib/stream_orchestrator/node_modules"
    cd "${placeholder "out"}/lib/stream_orchestrator/apps/stream_orchestrator"
    exec "${node}/bin/node" "./dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
}
