import { useEffect } from "react";
import { useAnimatedPhase } from "@/components/use_animated_phase";

export const useTrackBarPhase = (visible: boolean) => {
  const { phase, dispatch, animationProps } = useAnimatedPhase();

  useEffect(() => {
    dispatch(visible ? "show" : "hide");
  }, [visible, dispatch]);

  return { phase, animationProps };
};
