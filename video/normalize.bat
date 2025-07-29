@echo off
setlocal enabledelayedexpansion

REM --- 設定項目 ---
REM 目標ラウドネスパラメータ
set TARGET_I=-23
set TARGET_LRA=7
set TARGET_TP=-2

REM 出力先ディレクトリ名 (現在のディレクトリからの相対パス)
set OUTPUT_DIR=normalized_videos

REM 対象とする動画ファイルの拡張子 (スペース区切り)
set EXTENSIONS=*.mp4 *.mkv *.mov *.avi *.webm
REM --- 設定ここまで ---

REM 出力ディレクトリがなければ作成
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
    echo 出力ディレクトリ "%OUTPUT_DIR%" を作成しました。
)

echo 動画ファイルの音量正規化を開始します...
echo 目標ラウドネス: I=%TARGET_I% LUFS, LRA=%TARGET_LRA% LU, TP=%TARGET_TP% dBTP

for %%e in (%EXTENSIONS%) do (
    for %%f in (%%e) do (
        if exist "%%f" (
            echo Processing: "%%f"
            ffmpeg -i "%%f" -af loudnorm=I=%TARGET_I%:LRA=%TARGET_LRA%:TP=%TARGET_TP% -c:v copy -c:a aac -b:a 192k "%OUTPUT_DIR%\%%~nxf"
            if !errorlevel! neq 0 (
                echo   エラー: "%%f" の処理に失敗しました。
            ) else (
                echo   完了: "%OUTPUT_DIR%\%%~nxf"
            )
        )
    )
)

echo すべての処理が完了しました。
pause
