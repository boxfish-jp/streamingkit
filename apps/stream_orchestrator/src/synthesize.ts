import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import type { NotifyError, OnSynthesized, SynthesizeTag } from "kit_models";
import { TaskRunner } from "task_runner";

export class SynthesizeRunner {
  private _taskRunner = new TaskRunner();
  private _onErrorCallbacks: Array<NotifyError> = [];
  private _notifySynthesizedCallbacks: Array<OnSynthesized<void>> = [];

  registerOnError(callback: NotifyError) {
    this._onErrorCallbacks.push(callback);
  }

  removeOnError(callback: NotifyError) {
    this._onErrorCallbacks = this._onErrorCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  registerOnSynthesized(callback: OnSynthesized<void>) {
    this._notifySynthesizedCallbacks.push(callback);
  }

  removeOnSynthesized(callback: OnSynthesized<void>) {
    this._notifySynthesizedCallbacks = this._notifySynthesizedCallbacks.filter(
      (cb) => cb !== callback,
    );
  }

  addQueue(text: string, tag: SynthesizeTag) {
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
        cb({ type: "synthesized", buffer: data, tag: tag }),
      );
    };
    const errorHandler = (error: unknown) => {
      this._onErrorCallbacks.forEach((cb) => cb(String(error)));
    };
    this._taskRunner.addQueue(task, errorHandler);
  }
}
