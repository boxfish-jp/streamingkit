TARGET_I=-23
TARGET_LRA=7
TARGET_TP=-2

# Output directory (relative to current directory)
OUTPUT_DIR="normalized_videos"

# Target video file extensions (space separated)
EXTENSIONS=("mp4" "mkv" "mov" "avi" "webm")
# --- End of settings ---

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir "$OUTPUT_DIR"
    echo "Created output directory: $OUTPUT_DIR"
fi

echo "Starting volume normalization for video files..."
echo "Target loudness: I=${TARGET_I} LUFS, LRA=${TARGET_LRA} LU, TP=${TARGET_TP} dBTP"

for ext in "${EXTENSIONS[@]}"; do
    for f in *."$ext"; do
        [ -e "$f" ] || continue
        echo "Processing: \"$f\""
        ffmpeg -i "$f" -af loudnorm=I=${TARGET_I}:LRA=${TARGET_LRA}:TP=${TARGET_TP} -c:v copy -c:a aac -b:a 192k "$OUTPUT_DIR/$f"
        if [ $? -ne 0 ]; then
            echo "  Error: Failed to process \"$f\"."
        else
            echo "  Done: \"$OUTPUT_DIR/$f\""
        fi
    done
done

echo "All processing complete."
