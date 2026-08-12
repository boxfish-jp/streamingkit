import { cn } from "@workspace/ui/lib/utils";
import {
  type TransitionEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { TaskNodeTree } from "todo_parser/dist/task_node";
import { useDisplay } from "@/components/display";
import { getTodo } from "@/components/get_todo";

const CARD_ANIMATION_DURATION = 500;
const CHILD_ANIMATION_DURATION = 400;
const CHILD_ANIMATION_INTERVAL = 150;

type Phase =
  | "hidden"
  | "entering"
  | "childrenIn"
  | "shown"
  | "childrenOut"
  | "exiting";

export function App() {
  const [display] = useDisplay();
  const todo = getTodo();
  const parent = todo?.tree[0]?.children[0];
  const children = selectChildren(parent?.children);
  const [phase, setPhase] = useState<Phase>("hidden");
  const childrenCountRef = useRef(0);
  childrenCountRef.current = children.length;
  const childrenHeightRef = useRef(0);
  const ulRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (display) {
      setPhase("entering");
      return;
    }
    setPhase((prev) =>
      prev === "hidden" || prev === "childrenOut" || prev === "exiting"
        ? prev
        : "childrenOut",
    );
  }, [display]);

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
    if (phase !== "childrenIn") {
      return;
    }
    const ul = ulRef.current;
    if (!ul) {
      return;
    }
    const height = childrenHeightRef.current;
    if (height === 0) {
      setPhase("shown");
      return;
    }
    const duration =
      (childrenCountRef.current - 1) * CHILD_ANIMATION_INTERVAL +
      CHILD_ANIMATION_DURATION;
    const raf = requestAnimationFrame(() => {
      ul.style.transition = `height ${duration}ms ease-out`;
      ul.style.height = `${height}px`;
    });
    const fallback = setTimeout(() => {
      setPhase((prev) => (prev === "childrenIn" ? "shown" : prev));
    }, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      ul.style.transition = "";
      ul.style.height = "";
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "childrenOut") {
      return;
    }
    const ul = ulRef.current;
    if (!ul) {
      return;
    }
    const height = ul.offsetHeight;
    if (height === 0) {
      setPhase("exiting");
      return;
    }
    ul.style.height = `${height}px`;
    const duration =
      (childrenCountRef.current - 1) * CHILD_ANIMATION_INTERVAL +
      CHILD_ANIMATION_DURATION;
    const raf = requestAnimationFrame(() => {
      ul.style.transition = `height ${duration}ms ease-out`;
      ul.style.height = "0px";
    });
    const fallback = setTimeout(() => {
      setPhase((prev) => (prev === "childrenOut" ? "exiting" : prev));
    }, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [phase]);

  if (phase === "hidden" || !parent) {
    return null;
  }

  const onCardAnimationEnd = () => {
    if (phase === "entering") {
      setPhase(childrenCountRef.current === 0 ? "shown" : "childrenIn");
      return;
    }
    if (phase === "exiting") {
      setPhase("hidden");
    }
  };

  const onChildrenTransitionEnd = (
    event: TransitionEvent<HTMLUListElement>,
  ) => {
    if (event.propertyName !== "height") {
      return;
    }
    if (phase === "childrenIn") {
      setPhase("shown");
      return;
    }
    if (phase === "childrenOut") {
      setPhase("exiting");
    }
  };

  return (
    <div
      onAnimationEnd={onCardAnimationEnd}
      className={cn(
        "mt-auto mb-4 ml-auto mr-4 w-fit max-w-sm rounded-lg border border-white/10 bg-black/85 p-4 text-white",
        phase === "entering" &&
          "animate-in fade-in slide-in-from-right fill-mode-both",
        phase === "exiting" &&
          "animate-out fade-out slide-out-to-right fill-mode-both",
        phase === "childrenOut" && "overflow-hidden",
      )}
      style={{ animationDuration: `${CARD_ANIMATION_DURATION}ms` }}
    >
      <h2 className="mb-3 border-b border-lime-400/40 pb-2 text-base font-semibold text-lime-300">
        {parent.title}
      </h2>
      <ul
        ref={ulRef}
        onTransitionEnd={onChildrenTransitionEnd}
        className={cn(
          "flex flex-col gap-1.5",
          phase === "childrenOut" && "overflow-hidden",
        )}
      >
        {children.length > 0 &&
          children.map((child, index) => (
            <TaskRow
              key={child.id}
              child={child}
              index={index}
              count={children.length}
              phase={phase}
            />
          ))}
      </ul>
    </div>
  );
}

const TaskRow = ({
  child,
  index,
  count,
  phase,
}: {
  child: TaskNodeTree;
  index: number;
  count: number;
  phase: Phase;
}) => {
  const isActive = child.isStatusChanged && !child.isClosed;
  const isDone = child.newStatus === "DONE";
  const delay =
    phase === "childrenOut"
      ? (count - index - 1) * CHILD_ANIMATION_INTERVAL
      : index * CHILD_ANIMATION_INTERVAL;
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1",
        isActive && "bg-white/10",
        phase === "entering" && "opacity-0",
        phase === "childrenIn" &&
          "animate-in fade-in slide-in-from-top fill-mode-both",
        phase === "childrenOut" &&
          "animate-out fade-out slide-out-to-top fill-mode-both",
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${CHILD_ANIMATION_DURATION}ms`,
      }}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isActive
            ? "bg-orange-400"
            : child.isClosed
              ? "bg-white/30"
              : "bg-white/40",
        )}
      />
      <span
        className={cn(
          "text-sm",
          isActive
            ? "font-semibold text-orange-300"
            : child.isClosed
              ? "text-white/40 line-through"
              : "text-white/85",
        )}
      >
        {child.title}
      </span>
      <span className="ml-auto text-xs text-white/50">
        {child.isClosed
          ? isDone
            ? "✓"
            : "✗"
          : getStatusLabel(child.newStatus)}
      </span>
    </li>
  );
};

const selectChildren = (
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "TODO":
      return "未着手";
    case "THINKING":
      return "考え中";
    case "DEVELOPING":
      return "開発中";
    case "TEST":
      return "テスト";
    case "BUILDING":
      return "ビルド調整";
    case "DONE":
      return "完了";
    case "CANCELED":
      return "未定";
    default:
      return "";
  }
};
