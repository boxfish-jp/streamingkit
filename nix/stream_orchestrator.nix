{
  version,
  src,
  pnpmDeps,
  nativeBuildInputs,
  node,
  node-gyp,
  python3,
  stdenv,
  lib,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "stream_orchestrator";
  version = version;

  src = src;
  nativeBuildInputs = nativeBuildInputs ++ [
    node-gyp
    python3
  ];
  pnpmDeps = pnpmDeps;
  buildPhase = ''
    runHook preBuild
    for sqliteDir in node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3; do
      (
        cd "$sqliteDir"
        node-gyp rebuild --release --nodedir=${node}
      )
    done
    turbo build --filter=stream_orchestrator
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/$pname
    cp -a . $out/lib/$pname
    mkdir -p $out/bin

    NODE_BIN="${node}/bin/node"

    cat > $out/bin/$pname <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    export NODE_PATH="${placeholder "out"}/lib/stream_orchestrator/node_modules"
    cd "${placeholder "out"}/lib/stream_orchestrator/apps/stream_orchestrator"
    exec "$NODE_BIN" "./dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
  meta = {
    description = "配信ツールのストリームオーケストレーター";
    license = lib.licenses.mit;
  };
})
