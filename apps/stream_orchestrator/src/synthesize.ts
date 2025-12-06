import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { TaskRunner } from "task_runner";
import type { NotifyError } from "./types/error.js";
import type { NotifySynthesized } from "./types/synthesized.js";

export class SynthesizeRunner {
  private _taskRunner = new TaskRunner();
  private _onErrorCallbacks: Array<NotifyError> = [];
  private _notifySynthesizedCallbacks: Array<NotifySynthesized> = [];

  registerOnError(callback: NotifyError) {
    this._onErrorCallbacks.push(callback);
  }

  removeOnError(callback: NotifyError) {
    this._onErrorCallbacks = this._onErrorCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  registerOnSynthesized(callback: NotifySynthesized) {
    this._notifySynthesizedCallbacks.push(callback);
  }

  removeOnSynthesized(callback: NotifySynthesized) {
    this._notifySynthesizedCallbacks = this._notifySynthesizedCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  addQueue(text: string) {
    const task = async () => {
      const fileName = `${Date.now()}.wav`;
      const result = spawn(
        "/config/Voicepeak/voicepeak",
        ["-s", text, "-o", fileName],
        {
          stdio: ["pipe", "pipe", "inherit"],
        },
      );
      const timeout = setTimeout(() => {
        result.kill();
        throw new Error("Timeout");
      }, 30000);
      for await (const s of result.stdout) {
        console.log(`${s}`);
      }
      const status = await new Promise((resolve) => {
        result.on("close", resolve);
      });
      console.log(status);
      if (status !== 0) {
        throw new Error("voicepeak status error");
      }
      clearTimeout(timeout);
      const data = readFileSync(fileName);
      this._notifySynthesizedCallbacks.forEach((cb) =>
        cb({ type: "synthesized", buffer: data }),
      );
    };
    const errorHandler = (error: unknown) => {
      this._onErrorCallbacks.forEach((cb) => cb(String(error)));
    };
    this._taskRunner.addQueue(task, errorHandler);
  }
}
