import { cn } from "@workspace/ui/lib/utils";
import { type AnimationEvent, useEffect, useReducer } from "react";

export const PHASE_ANIMATION_DURATION = 500;

type AnimatedPhase = "hidden" | "entering" | "shown" | "exiting";

type PhaseAction = "show" | "hide" | "entered" | "exited";

const animatedPhaseReducer = (
  phase: AnimatedPhase,
  action: PhaseAction,
): AnimatedPhase => {
  switch (action) {
    case "show":
      return "entering";
    case "hide":
      return phase === "hidden" || phase === "exiting" ? phase : "exiting";
    case "entered":
      return phase === "entering" ? "shown" : phase;
    case "exited":
      return phase === "exiting" ? "hidden" : phase;
  }
};

const phaseAnimationClasses = (phase: AnimatedPhase) =>
  cn(
    phase === "entering" &&
      "animate-in fade-in slide-in-from-right fill-mode-both",
    phase === "exiting" &&
      "animate-out fade-out slide-out-to-right fill-mode-both",
  );

const useExitFallback = (
  phase: AnimatedPhase,
  dispatch: (action: PhaseAction) => void,
) => {
  useEffect(() => {
    if (phase !== "exiting") {
      return;
    }
    const fallback = setTimeout(() => {
      dispatch("exited");
    }, PHASE_ANIMATION_DURATION + 150);
    return () => clearTimeout(fallback);
  }, [phase, dispatch]);
};

export const useAnimatedPhase = () => {
  const [phase, dispatch] = useReducer(animatedPhaseReducer, "hidden");

  useExitFallback(phase, dispatch);

  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (phase === "entering") {
      dispatch("entered");
      return;
    }
    if (phase === "exiting") {
      dispatch("exited");
    }
  };

  return {
    phase,
    dispatch,
    animationProps: {
      className: phaseAnimationClasses(phase),
      style: { animationDuration: `${PHASE_ANIMATION_DURATION}ms` },
      onAnimationEnd,
    },
  };
};
