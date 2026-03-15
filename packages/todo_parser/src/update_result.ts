import type { ComparisonResult } from "./comparison.js";
import { type TaskNode, TaskNodeTree } from "./task_node.js";

export class UpdateResult {
  private _taskNodes: Map<string, TaskNode>;
  private _rootIds: Set<string>;
  private _activeTaskIds: Set<string> = new Set<string>();
  private _doneTaskIds: Set<string> = new Set<string>();

  constructor(taskNodes: Map<string, TaskNode>, rootIds: Set<string>) {
    this._taskNodes = taskNodes;
    this._rootIds = rootIds;
    for (const node of this._taskNodes.values()) {
      if (node.isStatusChanged) {
        if (node.isActive) {
          this._activeTaskIds.add(node.id);
        }
        if (node.isClosed) {
          this._doneTaskIds.add(node.id);
        }
      }
    }
  }

  static createFromComparisionResult = (
    comparison: ComparisonResult,
  ): UpdateResult => {
    const taskNodes = new Map<string, TaskNode>();
    for (const rootId of comparison.newDataRootIds) {
      const [nodes] = comparison.toTaskNodes(rootId);
      nodes.forEach((node, id) => {
        taskNodes.set(id, node);
      });
    }
    return new UpdateResult(taskNodes, comparison.newDataRootIds);
  };

  get taskNodes(): Map<string, TaskNode> {
    return this._taskNodes;
  }

  get activeTasks(): TaskNode[] {
    const tasks: TaskNode[] = [];
    for (const id of this._activeTaskIds) {
      const node = this._taskNodes.get(id);
      if (!node) {
        throw new Error(
          `activeTaskIdsに対応するnodeが見つかりませんでした。id: ${id}`,
        );
      }
      tasks.push(node);
    }
    return tasks;
  }

  get doneTasks(): TaskNode[] {
    const tasks: TaskNode[] = [];
    for (const id of this._doneTaskIds) {
      const node = this._taskNodes.get(id);
      if (!node) {
        throw new Error(
          `activeTaskIdsに対応するnodeが見つかりませんでした。id: ${id}`,
        );
      }
      tasks.push(node);
    }
    return tasks;
  }

  get tree(): TaskNodeTree[] {
    let relatedIds = new Set<string>();
    for (const focusId of this._focusTaskIds) {
      const node = this._taskNodes.get(focusId);
      if (!node) {
        throw new Error(
          `focusIdに対応するnodeが見つかりませんでした。id: ${focusId}`,
        );
      }
      relatedIds = new Set([...relatedIds, ...node.idPath]);
      if (!node.parentId) {
        continue;
      }
      const parentTask = this._taskNodes.get(node.parentId);
      if (!parentTask) {
        continue;
      }
      const siblingIds = parentTask.childrenIds.filter((id) => id !== node.id);
      relatedIds = new Set([
        ...relatedIds,
        ...parentTask.idPath,
        ...siblingIds,
      ]);
    }
    const relatedRootIds = [...relatedIds].filter((id) =>
      this._rootIds.has(id),
    );
    const addToTree = (id: string): TaskNodeTree | undefined => {
      const taskNode = this._taskNodes.get(id);
      if (!taskNode) {
        return undefined;
      }
      const childrenTree: TaskNodeTree[] = [];
      taskNode.childrenIds.forEach((childId) => {
        if (relatedIds.has(childId)) {
          const child = addToTree(childId);
          if (child) {
            childrenTree.push(child);
          }
        }
      });
      return TaskNodeTree.createFromTaskNode(taskNode, childrenTree);
    };
    const trees: TaskNodeTree[] = [];
    for (const rootId of relatedRootIds) {
      const tree = addToTree(rootId);
      if (tree) {
        trees.push(tree);
      }
    }
    return trees;
  }

  private get _focusTaskIds(): Set<string> {
    return new Set([...this._activeTaskIds, ...this._doneTaskIds]);
  }
}
