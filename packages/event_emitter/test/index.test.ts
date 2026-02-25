import { describe, expect, test } from "vitest";
import { EventEmitter } from "../src";

describe("EventEmitter", () => {
  test("登録した関数が対象のイベントで発火すること", async () => {
    interface TestEvent {
      test: [];
    }

    const emitter = new EventEmitter<TestEvent>();

    await new Promise<void>((resolve) => {
      emitter.on("test", () => {
        resolve();
      });
      emitter.emit("test");
    });
  });

  test("イベントを呼び出した際に、登録した関数が引数を受け取ること", async () => {
    interface TestEvent {
      test: [message: string];
    }

    const emitter = new EventEmitter<TestEvent>();

    await new Promise<void>((resolve) => {
      emitter.on("test", (message) => {
        expect(message).toBe("test");
        resolve();
      });
      emitter.emit("test", "test");
    });
  });

  test("複数のリスナーを登録した際に、全てのリスナーが呼び出されること", async () => {
    interface TestEvent {
      test: [message: string];
    }
    const emitter = new EventEmitter<TestEvent>();
    let count = 0;
    await new Promise<void>((resolve) => {
      emitter.on("test", (message) => {
        expect(message).toBe("it is test");
        count += 1;
        if (count === 2) resolve();
      });
      emitter.on("test", (message) => {
        expect(message).toBe("it is test");
        count += 1;
        if (count === 2) resolve();
      });
      emitter.emit("test", "it is test");
    });
    expect(count).toBe(2);
  });
});
