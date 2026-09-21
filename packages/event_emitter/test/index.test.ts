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

  test("onの戻り関数で解除すると、以降のemitで呼ばれない", () => {
    interface TestEvent {
      test: [];
    }
    const emitter = new EventEmitter<TestEvent>();
    let count = 0;
    const remove = emitter.on("test", () => {
      count += 1;
    });
    emitter.emit("test");
    remove();
    emitter.emit("test");
    expect(count).toBe(1);
  });

  test("解除関数の多重呼び出しや、emit中の解除でも他リスナーに届く", () => {
    interface TestEvent {
      test: [];
    }
    const emitter = new EventEmitter<TestEvent>();
    let count = 0;
    const removeFirst = emitter.on("test", () => {
      removeFirst();
      removeFirst();
    });
    emitter.on("test", () => {
      count += 1;
    });
    emitter.emit("test");
    expect(count).toBe(1);
  });
});
