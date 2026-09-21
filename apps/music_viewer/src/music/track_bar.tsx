import { cn } from "@workspace/ui/lib/utils";
import type { MediaInfoMessage } from "kit_models";
import { PHASE_ANIMATION_DURATION } from "@/components/use_animated_phase";
import { trackKey } from "@/components/use_music_info";
import { useTrackBarPhase } from "@/components/use_track_bar_phase";

export function TrackBar({ musicInfo }: { musicInfo: MediaInfoMessage }) {
  const visible = musicInfo.playbackStatus === "Playing";
  const { phase, animationProps } = useTrackBarPhase(visible);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      {...animationProps}
      className={cn(
        "max-w-lg text-2xl font-bold text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]",
        animationProps.className,
      )}
    >
      <div
        key={trackKey(musicInfo)}
        className="animate-in fade-in slide-in-from-bottom truncate fill-mode-both"
        style={{ animationDuration: `${PHASE_ANIMATION_DURATION}ms` }}
      >
        {[musicInfo.title, musicInfo.artist].filter(Boolean).join(" - ")}
      </div>
    </div>
  );
}
