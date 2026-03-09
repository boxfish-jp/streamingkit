import type { ParsedNodesMap } from "./parsed_node/parsed_node.js";
import { TaskDiff } from "./task_diff.js";
import { TaskNode } from "./task_node.js";

// 比較処理全体の結果
export class ComparisonResult {
  private _diffs: Map<string, TaskDiff>; // 新タスクのタスクの旧ステータスの差分
  private _newDataRootIds: Set<string>;

  constructor(diffs: Map<string, TaskDiff>, newDataRootIds: Set<string>) {
    this._diffs = diffs;
    this._newDataRootIds = newDataRootIds;
  }

  static createFromParsedNodes = (
    oldParsedNodes: ParsedNodesMap,
    newParsedNodes: ParsedNodesMap,
  ): ComparisonResult => {
    const diffs = new Map<string, TaskDiff>();
    const newDataRootIds = new Set<string>();
    for (const newTaskNode of newParsedNodes.values()) {
      const oldTaskNode = oldParsedNodes.get(newTaskNode.id);
      const [taskDiff, isRoot] = TaskDiff.createFromParsedTaskNode(
        oldTaskNode,
        newTaskNode,
      );
      diffs.set(newTaskNode.id, taskDiff);
      if (isRoot) {
        newDataRootIds.add(newTaskNode.id);
      }
    }
    return new ComparisonResult(diffs, newDataRootIds);
  };

  get diffs(): Map<string, TaskDiff> {
    return this._diffs;
  }

  get newDataRootIds(): Set<string> {
    return this._newDataRootIds;
  }

  public toTaskNodes = (
    id: string,
  ): [nodes: Map<string, TaskNode>, isDone: boolean] => {
    const diff = this.diffs.get(id);
    if (!diff) {
      throw new Error(`diffが見つかりませんでした。id: ${id}`);
    }
    const total = diff.childrenIds.length;
    if (total === 0) {
      const node = TaskNode.createFromTaskDiff(diff, {
        total: -1,
        doneCount: -1,
      });
      const isDone = diff.isClosed;
      return [new Map().set(node.id, node), isDone];
    }
    const nodes = new Map<string, TaskNode>();
    let doneCount = 0;
    for (const childId of diff.childrenIds) {
      const [newNodes, isDone] = this.toTaskNodes(childId);
      newNodes.forEach((node, id) => {
        nodes.set(id, node);
      });
      if (isDone) {
        doneCount++;
      }
    }
    const node = TaskNode.createFromTaskDiff(diff, {
      total,
      doneCount,
    });
    return [nodes.set(node.id, node), doneCount === total];
  };
}
