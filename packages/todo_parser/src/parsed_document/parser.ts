import type {
  ParsedDocument,
  ParsedTaskNode,
} from "../types/parsed_document.js";
import { type TaskStatus, taskStatusList } from "../types/status.js";

interface TaskLine {
  depth: number;
  status: TaskStatus | null;
  title: string;
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
  let status: TaskStatus | null = null;
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

export const parseDocument = (document: string): ParsedDocument => {
  const taskLines = parseEachLine(document);
  const stack: ParsedTaskNode[] = [];
  const nodes = new Map<string, ParsedTaskNode>();
  const rootNode: ParsedTaskNode = {
    id: "0",
    depth: 0,
    title: "root",
    rawTag: null,
    status: "TODO",
    parentId: null,
    childrenIds: [],
    lineIndex: -1,
    path: [],
  };
  stack.push(rootNode);
  nodes.set(rootNode.id, rootNode);
  const rootIds: string[] = [];

  for (let i = 0; i < taskLines.length; i++) {
    while (taskLines[i].depth <= stack[0].depth) {
      stack.shift();
    }
    const parentNode = nodes.get(stack[0].id);
    if (!parentNode) {
      throw new Error(`親ノードが見つかりませんでした: ${stack[0].id}`);
    }
    const id =
      parentNode.id === "0"
        ? `${parentNode.childrenIds.length + 1}`
        : `${parentNode.id}-${parentNode.childrenIds.length + 1}`;
    parentNode.childrenIds.push(id);
    const path = parentNode.path.concat(taskLines[i].title);
    const depth = taskLines[i].depth;
    const newNode: ParsedTaskNode = {
      id,
      depth: depth,
      title: taskLines[i].title,
      rawTag: taskLines[i].status,
      parentId: stack[0].id === "0" ? null : stack[0].id,
      status: taskLines[i].status || "TODO",
      childrenIds: [],
      lineIndex: i,
      path,
    };
    nodes.set(id, newNode);
    stack.unshift(newNode);
    if (depth === 1) {
      rootIds.push(id);
    }
  }
  nodes.delete(rootNode.id);
  return {
    rootIds,
    nodes,
  };
};
