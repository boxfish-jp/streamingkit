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
  pname = "voicevox_connector";
  inherit
    deps
    pnpm
    src
    version
    ;
  packageManager = "pnpm";
  nodejs = node;
  nativeBuildInputs = [ turbo ];
  buildCommand = "turbo build --filter=voicevox_connector";
  mainProgram = "voicevox_connector";
  meta = {
    description = "配信ツールのVOICEVOX TTSコネクタ";
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
    export NODE_PATH="${placeholder "out"}/lib/voicevox_connector/node_modules"
    exec "${node}/bin/node" "${placeholder "out"}/lib/voicevox_connector/apps/voicevox_connector/dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
}
