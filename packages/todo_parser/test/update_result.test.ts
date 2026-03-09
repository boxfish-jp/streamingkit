import { describe, expect, test } from "vitest";
import { ComparisonResult } from "../src/comparison.js";
import { parseNodes } from "../src/parsed_node/parser.js";
import { UpdateResult } from "../src/update_result.js";

describe("UpdateResult:", () => {
  describe("toTaskNodes:(statsの計算)", () => {
    test("子タスクを持たないタスクのstatsはtotal:-1,doneCount:-1になる", () => {
      const text = `* TODO a`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNodes =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      if (!taskNodes) {
        throw new Error("taskNodesが見つかりませんでした。id: 1");
      }
      expect(taskNodes.stats).toStrictEqual({ total: -1, doneCount: -1 });
    });

    test("親が複数あったとしても、子タスクを持たないタスクのstatsはtotal:-1,doneCount:-1になる", () => {
      const text = `
* TODO a
* TODO b
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode2 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("2");
      if (!taskNode1 || !taskNode2) {
        throw new Error("taskNodesが見つかりませんでした。id: 1");
      }
      expect(taskNode1.stats).toStrictEqual({ total: -1, doneCount: -1 });
      expect(taskNode2.stats).toStrictEqual({ total: -1, doneCount: -1 });
    });

    test("親子のタスクで子のタスクが完了していない場合", () => {
      const text = `
* TODO a
** TODO b
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode11 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-1");
      if (!taskNode1 || !taskNode11) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode1.stats).toStrictEqual({ total: 1, doneCount: 0 });
      expect(taskNode11.stats).toStrictEqual({ total: -1, doneCount: -1 });
    });

    test("親子のタスクで子のタスクが完了(DONE)している場合", () => {
      const text = `
* TODO a
** DONE b
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode11 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-1");
      if (!taskNode1 || !taskNode11) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode1.stats).toStrictEqual({ total: 1, doneCount: 1 });
      expect(taskNode11.stats).toStrictEqual({ total: -1, doneCount: -1 });
    });

    test("親子のタスクで子のタスクが完了(CANCELED)している場合", () => {
      const text = `
* TODO a
** CANCELED b
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode11 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-1");
      if (!taskNode1 || !taskNode11) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode1.stats).toStrictEqual({ total: 1, doneCount: 1 });
      expect(taskNode11.stats).toStrictEqual({ total: -1, doneCount: -1 });
    });

    test("親子のタスクで兄弟が複数いる場合", () => {
      const text = `
* TODO a
** DONE b
** THINKING c
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      if (!taskNode) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode.stats).toStrictEqual({ total: 2, doneCount: 1 });
    });

    test("親子のタスクで複数の兄弟がタスクを完了している場合", () => {
      const text = `
* TODO a
** DONE b
** DONE c
** DONE d
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      if (!taskNode) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode.stats).toStrictEqual({ total: 3, doneCount: 3 });
    });

    test("親孫のタスクで複数の孫がいる場合", () => {
      const text = `
* TODO a
** TODO b
*** DONE c
*** TODO d
*** TODO e
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode11 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-1");
      if (!taskNode1 || !taskNode11) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode1.stats).toStrictEqual({ total: 1, doneCount: 0 });
      expect(taskNode11.stats).toStrictEqual({ total: 3, doneCount: 1 });
    });

    test("親孫のタスクですべての孫がタスクを完了している場合は子タスクが明示的にステータスを振っていなくても自動的に判定される", () => {
      const text = `
* TODO a
** TODO b
*** DONE c
*** DONE d
*** DONE e
** TODO f
*** DONE g
*** DONE h
*** TODO i
`;
      const taskNodeMap = parseNodes(text);
      const comparisonResult = ComparisonResult.createFromParsedNodes(
        taskNodeMap,
        taskNodeMap,
      );
      const taskNode1 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1");
      const taskNode11 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-1");
      const taskNode12 =
        UpdateResult.createFromComparisionResult(
          comparisonResult,
        ).taskNodes.get("1-2");
      if (!taskNode1 || !taskNode11 || !taskNode12) {
        throw new Error("taskNodesが見つかりませんでした");
      }
      expect(taskNode1.stats).toStrictEqual({ total: 2, doneCount: 1 });
      expect(taskNode11.stats).toStrictEqual({ total: 3, doneCount: 3 });
      expect(taskNode12.stats).toStrictEqual({ total: 3, doneCount: 2 });
    });
  });
});
