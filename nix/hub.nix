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
  pname = "hub";
  inherit
    deps
    pnpm
    src
    version
    ;
  packageManager = "pnpm";
  nodejs = node;
  nativeBuildInputs = [ turbo ];
  buildCommand = "turbo build --filter=hub --filter=effect --filter=todo_viewer --filter=anime_viewer --filter=music_viewer";
  mainProgram = "hub";
  meta = {
    description = "配信ツールのWebSocketハブサーバー";
    license = lib.licenses.mit;
  };
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/$pname
    cp -a . $out/lib/$pname
    mkdir -p $out/lib/$pname/apps/hub/static
    mkdir -p $out/lib/$pname/apps/hub/video
    cp -r apps/effect/dist/* $out/lib/$pname/apps/hub/static/
    cp -r apps/todo_viewer/dist/* $out/lib/$pname/apps/hub/static/
    cp -r apps/anime_viewer/dist/* $out/lib/$pname/apps/hub/static/
    cp -r apps/music_viewer/dist/* $out/lib/$pname/apps/hub/static/
    cp -r $out/lib/hub/video/* $out/lib/$pname/apps/hub/video/
    mkdir -p $out/bin

    cat > $out/bin/$pname <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    export NODE_PATH="${placeholder "out"}/lib/hub/node_modules"
    cd "${placeholder "out"}/lib/hub/apps/hub/"
    exec "${node}/bin/node" "./dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
}
