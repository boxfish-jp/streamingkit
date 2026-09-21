import { useMusicInfo } from "@/components/use_music_info";
import { AlbumCard } from "./album_card";
import { TrackBar } from "./track_bar";

export function App() {
  const { musicInfo } = useMusicInfo();

  return (
    <main className="flex h-dvh flex-col items-end justify-end gap-4 p-4">
      {musicInfo && (
        <>
          <AlbumCard musicInfo={musicInfo} />
          <TrackBar musicInfo={musicInfo} />
        </>
      )}
    </main>
  );
}
