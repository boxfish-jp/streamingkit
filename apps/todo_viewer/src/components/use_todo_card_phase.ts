import {
  type RefObject,
  type TransitionEvent,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { parseTodo, type TaskNodeTree, type UpdateResult } from "todo_parser";
import { useSocket } from "@/components/socket";

const CARD_ANIMATION_DURATION = 500;
const CHILD_ANIMATION_DURATION = 400;
const CHILD_ANIMATION_INTERVAL = 150;

export type Phase =
  | "hidden"
  | "entering"
  | "childrenIn"
  | "shown"
  | "childrenOut"
  | "exiting";

export type ShowRequest = {
  key: number;
  duration: number;
};

type Action =
  | { type: "show" }
  | { type: "hide" }
  | { type: "cardEntered" }
  | { type: "cardExited" }
  | { type: "childrenEntered" }
  | { type: "childrenExited" };

function phaseReducer(phase: Phase, action: Action): Phase {
  switch (action.type) {
    case "show":
      return "entering";
    case "hide":
      return phase === "hidden" ||
        phase === "childrenOut" ||
        phase === "exiting"
        ? phase
        : "childrenOut";
    case "cardEntered":
      return phase === "entering" ? "childrenIn" : phase;
    case "cardExited":
      return phase === "exiting" ? "hidden" : phase;
    case "childrenEntered":
      return phase === "childrenIn" ? "shown" : phase;
    case "childrenExited":
      return phase === "childrenOut" ? "exiting" : phase;
  }
}

export function useTodoMessages(): {
  todo: UpdateResult | null;
  showRequest: ShowRequest | null;
} {
  const [todo, setTodo] = useState<UpdateResult | null>(null);
  const [showRequest, setShowRequest] = useState<ShowRequest | null>(null);
  const [addOnMessage] = useSocket();

  useEffect(() => {
    const remove = addOnMessage((message) => {
      if (message.type === "todoChanged") {
        const result = parseTodo(message.oldFile, message.newFile);
        if (result.activeTasks.length || result.doneTasks.length) {
          setTodo(result);
          setShowRequest({ key: Date.now(), duration: 10000 });
        }
      } else if (message.type === "todoShow") {
        setShowRequest({ key: Date.now(), duration: 15000 });
      }
    });
    return () => {
      remove();
    };
  }, [addOnMessage]);

  return { todo, showRequest };
}

export function useTodoCardAnimation(
  showRequest: ShowRequest | null,
  childCount: number,
): {
  phase: Phase;
  ulRef: RefObject<HTMLUListElement | null>;
  onCardAnimationEnd: () => void;
  onChildrenTransitionEnd: (event: TransitionEvent<HTMLUListElement>) => void;
} {
  const [phase, dispatch] = useReducer(phaseReducer, "hidden");
  const [time, setTime] = useState(0);
  const childrenHeightRef = useRef(0);
  const ulRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!showRequest) {
      return;
    }
    setTime(showRequest.duration);
    dispatch({ type: "show" });
  }, [showRequest]);

  useEffect(() => {
    if (phase !== "entering" && phase !== "childrenIn" && phase !== "shown") {
      return;
    }
    if (time <= 0) {
      dispatch({ type: "hide" });
      return;
    }
    const timer = setTimeout(() => {
      setTime((prev) => prev - 1000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [time, phase]);

  useLayoutEffect(() => {
    if (phase !== "entering") {
      return;
    }
    const ul = ulRef.current;
    if (!ul) {
      return;
    }
    ul.style.transition = "";
    ul.style.height = "0px";
    childrenHeightRef.current = ul.scrollHeight;
  }, [phase]);

  useEffect(() => {
    if (phase !== "childrenIn" && phase !== "childrenOut") {
      return;
    }
    const ul = ulRef.current;
    if (!ul) {
      return;
    }
    const height =
      phase === "childrenIn" ? childrenHeightRef.current : ul.offsetHeight;
    if (height === 0) {
      dispatch(
        phase === "childrenIn"
          ? { type: "childrenEntered" }
          : { type: "childrenExited" },
      );
      return;
    }
    if (phase === "childrenOut") {
      ul.style.height = `${height}px`;
    }
    const duration =
      (childCount - 1) * CHILD_ANIMATION_INTERVAL + CHILD_ANIMATION_DURATION;
    const raf = requestAnimationFrame(() => {
      ul.style.transition = `height ${duration}ms ease-out`;
      ul.style.height = phase === "childrenIn" ? `${height}px` : "0px";
    });
    const action =
      phase === "childrenIn"
        ? { type: "childrenEntered" as const }
        : { type: "childrenExited" as const };
    const fallback = setTimeout(() => {
      dispatch(action);
    }, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      if (phase === "childrenIn") {
        ul.style.transition = "";
        ul.style.height = "";
      }
    };
  }, [phase, childCount]);

  useEffect(() => {
    if (phase !== "exiting") {
      return;
    }
    const fallback = setTimeout(() => {
      dispatch({ type: "cardExited" });
    }, CARD_ANIMATION_DURATION + 150);
    return () => clearTimeout(fallback);
  }, [phase]);

  const onCardAnimationEnd = () => {
    if (phase === "entering") {
      dispatch(
        childCount === 0
          ? { type: "childrenEntered" }
          : { type: "cardEntered" },
      );
      return;
    }
    if (phase === "exiting") {
      dispatch({ type: "cardExited" });
    }
  };

  const onChildrenTransitionEnd = (
    event: TransitionEvent<HTMLUListElement>,
  ) => {
    if (event.propertyName !== "height") {
      return;
    }
    if (phase === "childrenIn") {
      dispatch({ type: "childrenEntered" });
      return;
    }
    if (phase === "childrenOut") {
      dispatch({ type: "childrenExited" });
    }
  };

  return { phase, ulRef, onCardAnimationEnd, onChildrenTransitionEnd };
}

export const selectChildren = (
  children: TaskNodeTree[] | undefined,
): TaskNodeTree[] => {
  if (!children) {
    return [];
  }
  const changedTaskIndex = children.findIndex((task) => task.isStatusChanged);
  if (changedTaskIndex === -1 || changedTaskIndex === children.length - 1) {
    return children.slice(-3);
  }
  if (changedTaskIndex === 0) {
    return children.slice(0, 3);
  }
  return children.slice(changedTaskIndex - 1, changedTaskIndex + 2);
};