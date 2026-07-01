{
  version,
  desktopSrc,
  stdenv,
  lib,
  appimage-run,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "desktop";
  version = version;
  src = desktopSrc;
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/$pname
    cp -a . $out/lib/$pname
    mkdir -p $out/bin

    cat > $out/bin/$pname <<EOF
    #!/usr/bin/env bash
    set -euo pipefail
    exec "${lib.getExe appimage-run}" "${desktopSrc}/desktop_client-1.0.0.AppImage" "\$@"

    EOF
    chmod +x $out/bin/$pname
    runHook postInstall
  '';
  meta = {
    description = "配信ツールのデスクトップアプリ";
    license = lib.licenses.mit;
  };
})
