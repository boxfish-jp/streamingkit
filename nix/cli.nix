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
  pname = "cli";
  version = version;
  src = src;
  nativeBuildInputs = nativeBuildInputs;
  pnpmDeps = pnpmDeps;
  buildPhase = ''
    runHook preBuild
    turbo build --filter=cli
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
    export NODE_PATH="${placeholder "out"}/lib/cli/node_modules"
    exec "$NODE_BIN" "${placeholder "out"}/lib/cli/apps/cli/dist/index.js" "\$@"
    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
  meta = {
    description = "配信ツールのCLI";
    license = lib.licenses.mit;
  };
})
