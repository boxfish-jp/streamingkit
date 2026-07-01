{
  version,
  src,
  pnpmDeps,
  nativeBuildInputs,
  node,
  stdenv,
  lib,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "hub";
  version = version;

  src = src;
  nativeBuildInputs = nativeBuildInputs;
  pnpmDeps = pnpmDeps;
  buildPhase = ''
    runHook preBuild
    turbo build --filter=hub --filter=effect --filter=todo_viewer --filter=anime_viewer
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/$pname
    cp -a . $out/lib/$pname
    mkdir -p $out/lib/$pname/apps/hub/static
    mkdir -p $out/lib/$pname/apps/hub/video
    cp -r apps/effect/dist/* $out/lib/$pname/apps/hub/static/
    cp -r apps/todo_viewer/dist/* $out/lib/$pname/apps/hub/static/
    cp -r apps/anime_viewer/dist/* $out/lib/$pname/apps/hub/static/
    cp -r $out/lib/hub/video/* $out/lib/$pname/apps/hub/video/
    mkdir -p $out/bin

    NODE_BIN="${node}/bin/node"

    cat > $out/bin/$pname <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    export NODE_PATH="${placeholder "out"}/lib/hub/node_modules"
    cd "${placeholder "out"}/lib/hub/apps/hub/"
    exec "$NODE_BIN" "./dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
  meta = {
    description = "配信ツールのWebSocketハブサーバー";
    license = lib.licenses.mit;
  };
})
