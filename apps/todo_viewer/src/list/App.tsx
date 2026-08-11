import { cn } from "@workspace/ui/lib/utils";
import type { TaskNodeTree } from "todo_parser/dist/task_node";
import { useDisplay } from "@/components/display";
import { getTodo } from "@/components/get_todo";

export function App() {
  const [display] = useDisplay();
  const todo = getTodo();
  const parent = todo?.tree[0]?.children[0];
  const children = selectChildren(parent?.children);
  return (
    display &&
    parent && (
      <div className="mt-auto mb-4 w-full max-w-sm self-center rounded-lg border border-white/10 bg-black/50 p-4 text-white">
        <h2 className="mb-3 border-b border-lime-400/40 pb-2 text-base font-semibold text-lime-300">
          {parent.title}
        </h2>
        <ul className="flex flex-col gap-1.5">
          {children.length > 0 &&
            children.map((child) => <TaskRow key={child.id} child={child} />)}
        </ul>
      </div>
    )
  );
}

const TaskRow = ({ child }: { child: TaskNodeTree }) => {
  const isActive = child.isStatusChanged && !child.isClosed;
  const isDone = child.newStatus === "DONE";
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1",
        isActive && "bg-white/10",
      )}
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
        {child.isClosed ? (isDone ? "✓" : "✗") : getStatusLabel(child.newStatus)}
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