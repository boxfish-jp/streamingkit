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
  pname = "voicevox_connector";
  version = version;

  src = src;
  nativeBuildInputs = nativeBuildInputs;
  pnpmDeps = pnpmDeps;
  buildPhase = ''
    runHook preBuild
    pnpm install --frozen-lockfile
    turbo build --filter=voicevox_connector
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
    export NODE_PATH="${placeholder "out"}/lib/voicevox_connector/node_modules"
    exec "$NODE_BIN" "${placeholder "out"}/lib/voicevox_connector/apps/voicevox_connector/dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
  meta = {
    description = "配信ツールのVOICEVOX TTSコネクタ";
    license = lib.licenses.mit;
  };
})
