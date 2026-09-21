import { cn } from "@workspace/ui/lib/utils";
import type { MediaInfoMessage } from "kit_models";
import { useAlbumCardPhase } from "@/components/use_album_card_phase";

export function AlbumCard({ musicInfo }: { musicInfo: MediaInfoMessage }) {
  const { phase, animationProps } = useAlbumCardPhase(musicInfo);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      {...animationProps}
      className={cn(
        "flex w-fit max-w-xs items-center gap-4 rounded-lg border border-white/10 bg-black/80 p-4 text-white",
        animationProps.className,
      )}
    >
      {musicInfo.artworkUrl.startsWith("http") ? (
        <img
          src={musicInfo.artworkUrl}
          alt=""
          className="h-24 w-24 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-white/10 text-3xl">
          ♪
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs tracking-wider text-white/50 uppercase">
          Now Playing
        </span>
        {musicInfo.artist && (
          <span className="line-clamp-2 text-base font-semibold text-white">
            {musicInfo.artist}
          </span>
        )}
        {musicInfo.album && (
          <span className="line-clamp-2 text-sm text-white/70">
            {musicInfo.album}
          </span>
        )}
      </div>
    </div>
  );
}
