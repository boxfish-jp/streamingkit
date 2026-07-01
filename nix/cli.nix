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
    turbo prune cli --docker
    mkdir pruned && cd pruned
    cp -r ../out/json/. .
    pnpm install --frozen-lockfile
    cp -r ../out/full/. .
    cp ../tsconfig.package-build.json ./
    cp ../tsconfig.develop.json ./
    turbo build
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
