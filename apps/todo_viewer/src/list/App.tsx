import { cn } from "@workspace/ui/lib/utils";
import type { TaskNodeTree } from "todo_parser";
import {
  type Phase,
  selectChildren,
  useTodoCardAnimation,
  useTodoMessages,
} from "@/components/use_todo_card_phase";

const CARD_ANIMATION_DURATION = 500;
const CHILD_ANIMATION_DURATION = 400;
const CHILD_ANIMATION_INTERVAL = 150;

export function App() {
  const { todo, showRequest } = useTodoMessages();
  const parent = todo?.tree[0]?.children[0];
  const children = selectChildren(parent?.children);
  const { phase, ulRef, onCardAnimationEnd, onChildrenTransitionEnd } =
    useTodoCardAnimation(showRequest, children.length);

  if (phase === "hidden" || !parent) {
    return null;
  }

  return (
    <div
      onAnimationEnd={onCardAnimationEnd}
      className={cn(
        "mt-auto mb-4 ml-auto mr-4 w-fit max-w-sm rounded-lg border border-white/10 bg-black/95 p-4 text-white",
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
        "flex items-center gap-2 rounded-lg px-2 py-1",
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
