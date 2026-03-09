import { describe, expect, test } from "vitest";
import { TaskDiff } from "../src/comparison.js";
import { parseNodes } from "../src/parsed_node/parser.js";

describe("TaskDiff:", () => {
  test("isStatusChangedは昔のステータスと新しいステータスが同じときにfalseを返す", () => {
    const diff = new TaskDiff("", "", "DONE", "DONE", [], null, []);
    expect(diff.isStatusChanged).toBe(false);
  });

  test("isStatusChangedは昔のステータスと新しいステータスが異なるときにtrueを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "DONE", [], null, []);
    expect(diff.isStatusChanged).toBe(true);
  });

  test("新しいステータスがTODOのときにisActive:false,isClosed:falseを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "TODO", [], null, []);
    expect(diff.isActive).toBe(false);
    expect(diff.isClosed).toBe(false);
  });

  test("新しいステータスがTHINKINGのときにisActive:true,isClosed:falseを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "THINKING", [], null, []);
    expect(diff.isActive).toBe(true);
    expect(diff.isClosed).toBe(false);
  });

  test("新しいステータスがDEVELOPINGのときにisActive:true,isClosed:falseを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "DEVELOPING", [], null, []);
    expect(diff.isActive).toBe(true);
    expect(diff.isClosed).toBe(false);
  });

  test("新しいステータスがBUILDINGのときにisActive:true,isClosed:falseを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "BUILDING", [], null, []);
    expect(diff.isActive).toBe(true);
    expect(diff.isClosed).toBe(false);
  });

  test("新しいステータスがTESTのときにisActive:true,isClosed:falseを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "TEST", [], null, []);
    expect(diff.isActive).toBe(true);
    expect(diff.isClosed).toBe(false);
  });

  test("新しいステータスがDONEのときにisActive:false,isClosed:trueを返す", () => {
    const diff = new TaskDiff("", "", "DEVELOPING", "DONE", [], null, []);
    expect(diff.isActive).toBe(false);
    expect(diff.isClosed).toBe(true);
  });

  test("新しいステータスがCANECELDのときにisActive:false,isClosed:trueを返す", () => {
    const diff = new TaskDiff("", "", "CANCELED", "DONE", [], null, []);
    expect(diff.isActive).toBe(false);
    expect(diff.isClosed).toBe(true);
  });

  test("updateNewStatusToDoneを使用するとnewStatusがdoneに上書きされる", () => {
    const diff = new TaskDiff("", "", "CANCELED", "THINKING", [], null, []);
    diff.updateNewStatusToDone();
    expect(diff.newStatus).toBe("DONE");
  });
});

describe("createFromParsedTaskNode:", () => {
  test("異なるIDのParsedTaskNode同士からTaskNodeを作成しようとするとエラーが発生する", () => {
    const oldText = `
* TODO a
* TODO B
* `.trim();
    const newText = `* TODO a`;
    const oldTaskNode = parseNodes(oldText).get("2");
    const newTaskNode = parseNodes(newText).get("1");
    if (!oldTaskNode || !newTaskNode) {
      throw new Error("タスクノードの取得に失敗");
    }
    expect(() =>
      TaskDiff.createFromParsedTaskNode(oldTaskNode, newTaskNode),
    ).toThrowError();
  });

  test("古いParsedTaskNodeがundefinedだったとしても、idが異なることによるエラーは発生しない", () => {
    const newText = `* TODO a`;
    const newTaskNode = parseNodes(newText).get("1");
    if (!newTaskNode) {
      throw new Error("タスクノードの取得に失敗");
    }
    TaskDiff.createFromParsedTaskNode(undefined, newTaskNode);
  });

  test("古いParsedTaskNodeがundefinedだったとしてもだった場合は,oldStatusがNEWになる", () => {
    const newText = `* TODO a`;
    const newTaskNode = parseNodes(newText).get("1");
    if (!newTaskNode) {
      throw new Error("タスクノードの取得に失敗");
    }
    const [taskDiff] = TaskDiff.createFromParsedTaskNode(
      undefined,
      newTaskNode,
    );
    expect(taskDiff.oldStatus).toBe("NEW");
  });

  test("oldTaskNode以外の項目はすべて新しいparsedTaskNodeの内容が引き継がれる", () => {
    const oldText = `
* TODO a
** THINKING b
`;
    const newText = `
* TODO a
** DEVELOPING b
`.trim();
    const oldParsedNode1 = parseNodes(oldText).get("1");
    const oldParsedNode2 = parseNodes(oldText).get("1-1");
    const newParsedNode1 = parseNodes(newText).get("1");
    const newParsedNode2 = parseNodes(newText).get("1-1");
    if (
      !oldParsedNode1 ||
      !oldParsedNode2 ||
      !newParsedNode1 ||
      !newParsedNode2
    ) {
      throw new Error("タスクノードの取得に失敗");
    }
    const [taskDiff1, isRoot1] = TaskDiff.createFromParsedTaskNode(
      oldParsedNode1,
      newParsedNode1,
    );
    const [taskDiff2, isRoot2] = TaskDiff.createFromParsedTaskNode(
      oldParsedNode2,
      newParsedNode2,
    );
    expect(taskDiff1.id).toBe(newParsedNode1.id);
    expect(taskDiff1.title).toBe(newParsedNode1.title);
    expect(taskDiff1.newStatus).toBe(newParsedNode1.status);
    expect(taskDiff1.path).toEqual(newParsedNode1.path);
    expect(taskDiff1.parentId).toBe(newParsedNode1.parentId);
    expect(taskDiff1.childrenIds).toEqual(newParsedNode1.childrenIds);
    expect(isRoot1).toBe(true);
    expect(taskDiff2.id).toBe(newParsedNode2.id);
    expect(taskDiff2.title).toBe(newParsedNode2.title);
    expect(taskDiff2.newStatus).toBe(newParsedNode2.status);
    expect(taskDiff2.path).toEqual(newParsedNode2.path);
    expect(taskDiff2.parentId).toBe(newParsedNode2.parentId);
    expect(taskDiff2.childrenIds).toEqual(newParsedNode2.childrenIds);
    expect(isRoot2).toBe(false);
  });
});
