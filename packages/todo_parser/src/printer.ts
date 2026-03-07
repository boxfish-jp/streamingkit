import type { Task } from "./type.js";

const taskPrinter = (task: Task, depth: number): string => {
  const lines = [
    `${"*".repeat(depth)}${task.status === "NONE" ? " " : ` ${task.status} `}${task.title}\n`,
  ];
  if (task.children) {
    for (const t of task.children) {
      lines.push(taskPrinter(t, depth + 1));
    }
  }
  return lines.join("");
};

export const printTasks = (tasks: Task[]): string => {
  const lines = [];
  for (const task of tasks) {
    lines.push(taskPrinter(task, 1));
  }
  return lines.join("").trim();
};
