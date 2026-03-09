import { TaskDiff } from "./task_diff.js";

export class TaskNode extends TaskDiff {
  private _stats: TaskStats;

  constructor(
    stats: TaskStats,
    ...args: ConstructorParameters<typeof TaskDiff>
  ) {
    super(...args);
    this._stats = stats;
  }

  static createFromTaskDiff = (
    taskNode: TaskDiff,
    stats: TaskStats,
  ): TaskNode => {
    return new TaskNode(
      stats,
      taskNode.id,
      taskNode.title,
      taskNode.oldStatus,
      taskNode.newStatus,
      taskNode.idPath,
      taskNode.titlePath,
      taskNode.parentId,
      taskNode.childrenIds,
    );
  };

  get stats(): TaskStats {
    return this._stats;
  }
}

export class TaskNodeTree extends TaskNode {
  private _children: TaskNodeTree[];

  constructor(
    children: TaskNodeTree[],
    ...args: ConstructorParameters<typeof TaskNode>
  ) {
    super(...args);
    this._children = children;
  }

  static createFromTaskNode = (
    taskNode: TaskNode,
    children: TaskNodeTree[],
  ): TaskNodeTree => {
    return new TaskNodeTree(
      children,
      taskNode.stats,
      taskNode.id,
      taskNode.title,
      taskNode.oldStatus,
      taskNode.newStatus,
      taskNode.idPath,
      taskNode.titlePath,
      taskNode.parentId,
      taskNode.childrenIds,
    );
  };

  get children(): TaskNodeTree[] {
    return this._children;
  }
}

interface TaskStats {
  total: number;
  doneCount: number;
}
