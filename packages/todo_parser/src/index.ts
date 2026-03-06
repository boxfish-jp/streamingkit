import { type Task, type TaskStatus, taskStatusList } from "./type.js";

interface TaskLine {
  depth: number;
  status: TaskStatus;
  title: string;
  children: TaskLine[];
}

const parseLine = (line: string): TaskLine => {
  let depth = 0;
  while (line.startsWith("*")) {
    depth++;
    line = line.slice(1);
  }
  if (depth === 0) {
    throw new Error(`行頭は*で始まる必要があります:${line.slice(0, 1)}`);
  }
  while (line.startsWith(" ")) {
    line = line.slice(1);
  }
  let status = "NONE" as TaskStatus;
  for (const s of taskStatusList) {
    if (line.startsWith(s)) {
      status = s;
      line = line.slice(s.length);
    }
  }
  while (line.startsWith(" ")) {
    line = line.slice(1);
  }
  return {
    depth,
    status,
    title: line.replace(/\n/g, ""),
    children: [],
  };
};

const parseEachLine = (stringLines: string): TaskLine[] => {
  const lines = stringLines.split("\n");
  const taskLines: TaskLine[] = [];
  for (const line of lines) {
    if (line.startsWith("*")) {
      taskLines.push(parseLine(line));
    }
  }
  return taskLines;
};

const makeTaskLineTree = (taskLines: TaskLine[]): TaskLine => {
  const stack: TaskLine[] = [];
  stack.push({ depth: 0, status: "NONE", title: "root", children: [] });
  for (const taskLine of taskLines) {
    while (taskLine.depth <= stack[0].depth) {
      stack.shift();
    }
    stack[0].children.push(taskLine);
    stack.unshift(taskLine);
  }
  return stack[stack.length - 1];
};

const convertTaskTreeToTask = (taskTree: TaskLine): Task[] => {
  return taskTree.children.map((line) => {
    if (line.children.length > 0) {
      const children = convertTaskTreeToTask(line);
      return {
        title: line.title,
        status: line.status,
        children,
      };
    }
    return {
      title: line.title,
      status: line.status,
    };
  });
};

export const parseTodo = (data: string): Task[] => {
  const taskLines = parseEachLine(data);
  const taskTree = makeTaskLineTree(taskLines);
  const tasks = convertTaskTreeToTask(taskTree);
  return tasks;
};
