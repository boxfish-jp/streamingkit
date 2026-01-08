import { beforeEach, describe, expect, test } from "vitest";
import { TaskRunner } from "../src";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("TaskRunner", () => {
  let taskRunner: TaskRunner;
  let executionLog: string[];

  beforeEach(() => {
    taskRunner = new TaskRunner();
    executionLog = [];
  });

  test("順番通りに直列実行されること (Sequential Execution)", async () => {
    // 処理時間がバラバラなタスクを追加
    // タスク1: 100ms (遅い)
    taskRunner.addQueue(async () => {
      executionLog.push("Task 1 Start");
      await sleep(100);
      executionLog.push("Task 1 End");
    });

    // タスク2: 10ms (速い)
    // 並列実行されていれば、Task 2が先に終わってしまうはず
    taskRunner.addQueue(async () => {
      executionLog.push("Task 2 Start");
      await sleep(10);
      executionLog.push("Task 2 End");
    });

    await sleep(200);

    // 期待値: Task 1が終わってから Task 2が始まること
    expect(executionLog).toEqual([
      "Task 1 Start",
      "Task 1 End",
      "Task 2 Start", // 必ず Task 1 End のあとに来る
      "Task 2 End",
    ]);
  });

  test("途中でエラーが発生しても、後続のタスクが実行されること", async () => {
    const errorLog: string[] = [];

    // タスク1: 成功
    taskRunner.addQueue(async () => {
      executionLog.push("Task 1");
    });

    // タスク2: 失敗
    taskRunner.addQueue(
      async () => {
        throw new Error("Something went wrong");
      },
      (err) => {
        errorLog.push((err as Error).message);
      },
    );

    // タスク3: 成功 (タスク2で止まっていないか確認)
    taskRunner.addQueue(async () => {
      executionLog.push("Task 3");
    });

    await sleep(50);

    expect(executionLog).toEqual(["Task 1", "Task 3"]); // タスク3も実行されている
    expect(errorLog).toEqual(["Something went wrong"]); // エラーハンドラが呼ばれている
  });

  test("非同期に後から追加されたタスクも処理されること", async () => {
    // 最初にタスクを追加
    taskRunner.addQueue(async () => {
      executionLog.push("Task 1");
      await sleep(50);
    });

    // Task 1 実行中に、外部から非同期に Task 2 を追加
    setTimeout(() => {
      taskRunner.addQueue(async () => {
        executionLog.push("Task 2");
      });
    }, 20);

    await sleep(100);

    expect(executionLog).toEqual(["Task 1", "Task 2"]);
  });
});
