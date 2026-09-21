import type { MediaInfoMessage } from "kit_models";
import { useEffect, useRef, useState } from "react";
import { useAnimatedPhase } from "@/components/use_animated_phase";
import { trackKey } from "@/components/use_music_info";

const ALBUM_CARD_DURATION = 8000;

export const useAlbumCardPhase = (musicInfo: MediaInfoMessage) => {
  const { phase, dispatch, animationProps } = useAnimatedPhase();
  const [time, setTime] = useState(0);
  const lastTrackKeyRef = useRef<string | null>(null);
  const playing = musicInfo.playbackStatus === "Playing";

  useEffect(() => {
    if (musicInfo.playbackStatus !== "Playing") {
      lastTrackKeyRef.current = null;
      return;
    }
    const key = trackKey(musicInfo);
    if (key === lastTrackKeyRef.current) {
      return;
    }
    lastTrackKeyRef.current = key;
    if (!musicInfo.album && !musicInfo.artworkUrl && !musicInfo.artist) {
      return;
    }
    setTime(ALBUM_CARD_DURATION);
    dispatch("show");
  }, [musicInfo, dispatch]);

  useEffect(() => {
    if (phase !== "entering" && phase !== "shown") {
      return;
    }
    if (time <= 0 || !playing) {
      dispatch("hide");
      return;
    }
    const timer = setTimeout(() => {
      setTime((prev) => prev - 1000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [time, phase, playing, dispatch]);

  return { phase, animationProps };
};
