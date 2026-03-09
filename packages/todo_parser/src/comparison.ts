import type { ParsedNode, ParsedNodesMap } from "./parsed_node/parsed_node.js";
import type { TaskStatus } from "./status.js";

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
}

export class TaskDiff {
  private _id: string;
  private _title: string;
  private _oldStatus: TaskStatus | "NEW"; // 旧データに存在しなかった場合
  private _newStatus: TaskStatus;
  private _path: string[]; // 自身を含む先祖タスク名のリスト
  private _parentId: string | null; // 親タスクのID（ルートはnull）
  private _childrenIds: string[]; // 子タスクのIDリスト

  constructor(
    id: string,
    title: string,
    oldStatus: TaskStatus | "NEW",
    newStatus: TaskStatus,
    path: string[],
    parentId: string | null,
    childrenIds: string[],
  ) {
    this._id = id;
    this._title = title;
    this._oldStatus = oldStatus;
    this._newStatus = newStatus;
    this._path = path;
    this._parentId = parentId;
    this._childrenIds = childrenIds;
  }

  static createFromParsedTaskNode = (
    oldTaskNode: ParsedNode | undefined,
    newTaskNode: ParsedNode,
  ): [taskDiff: TaskDiff, isRoot: boolean] => {
    if (oldTaskNode && oldTaskNode.id !== newTaskNode.id) {
      throw new Error("oldTaskNodeとnewTaskNodeのIDが一致しません");
    }

    const taskDiff = new TaskDiff(
      newTaskNode.id,
      newTaskNode.title,
      oldTaskNode ? oldTaskNode.status : "NEW",
      newTaskNode.status,
      newTaskNode.path,
      newTaskNode.parentId,
      newTaskNode.childrenIds,
    );
    return [taskDiff, newTaskNode.parentId === null];
  };

  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get oldStatus(): TaskStatus | "NEW" {
    return this._oldStatus;
  }

  public get newStatus(): TaskStatus {
    return this._newStatus;
  }

  public updateNewStatusToDone() {
    this._newStatus = "DONE";
  }

  public get path(): string[] {
    return this._path;
  }

  public get parentId(): string | null {
    return this._parentId;
  }

  public get childrenIds(): string[] {
    return this._childrenIds;
  }

  public get isStatusChanged(): boolean {
    return this._oldStatus !== this._newStatus;
  }

  public get isActive(): boolean {
    return (
      this._newStatus === "THINKING" ||
      this._newStatus === "DEVELOPING" ||
      this._newStatus === "BUILDING" ||
      this._newStatus === "TEST"
    );
  }

  public get isClosed(): boolean {
    return this._newStatus === "DONE" || this._newStatus === "CANCELED";
  }
}
