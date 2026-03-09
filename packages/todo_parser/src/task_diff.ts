import type { ParsedNode } from "./parsed_node/parsed_node.js";
import type { TaskStatus } from "./status.js";

export class TaskDiff {
  private _id: string;
  private _title: string;
  private _oldStatus: TaskStatus | "NEW"; // 旧データに存在しなかった場合
  private _newStatus: TaskStatus;
  private _titlePath: string[]; // 自身を含む先祖タスク名のリスト
  private _idPath: string[]; // 自身を含む先祖タスク名のリスト
  private _parentId: string | null; // 親タスクのID（ルートはnull）
  private _childrenIds: string[]; // 子タスクのIDリスト

  constructor(
    id: string,
    title: string,
    oldStatus: TaskStatus | "NEW",
    newStatus: TaskStatus,
    idPath: string[],
    titlePath: string[],
    parentId: string | null,
    childrenIds: string[],
  ) {
    this._id = id;
    this._title = title;
    this._oldStatus = oldStatus;
    this._newStatus = newStatus;
    this._idPath = idPath;
    this._titlePath = titlePath;
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
      newTaskNode.idPath,
      newTaskNode.titlePath,
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

  public get titlePath(): string[] {
    return this._titlePath;
  }

  public get idPath(): string[] {
    return this._idPath;
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
