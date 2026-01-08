import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFileSync, unlinkSync } from "node:fs";
import type {
  ErrorMessage,
  SynthesizedMessage,
  SynthesizeTag,
} from "kit_models";
import { TaskRunner } from "task_runner";

interface SynthesizeRunnerMessages {
  synthesized: [message: SynthesizedMessage];
  error: [message: ErrorMessage];
}

export class SynthesizeRunner extends EventEmitter<SynthesizeRunnerMessages> {
  private _taskRunner = new TaskRunner();

  addQueue(text: string, tag: SynthesizeTag, retryCount = 0) {
    if (retryCount > 5) {
      this.emit("error", {
        type: "error",
        status: "serverSynthesize",
        time: Date.now(),
        message: "リトライ上限を超えました",
      });
      return;
    }
    const task = async () => {
      const fileName = `${Date.now()}.wav`;
      try {
        const result = spawn(
          "/mountspace/Voicepeak/voicepeak",
          ["-s", text, "-o", fileName],
          {
            stdio: ["pipe", "pipe", "inherit"],
          },
        );

        try {
          const timeout = setTimeout(() => {
            this.emit("error", {
              type: "error",
              status: "serverSynthesizeDelay",
              time: Date.now(),
              message: "Timeout",
            });
          }, 30000);

          // エラーイベントをPromiseで待つ
          const status = await new Promise<number>((resolve, reject) => {
            result.on("close", resolve);
            result.on("error", reject);
          });

          clearTimeout(timeout);

          if (status !== 0) {
            this.addQueue(text, tag, retryCount + 1);
            return;
          }
          const data = readFileSync(fileName);
          this.emit("synthesized", {
            type: "synthesized",
            buffer: data,
            tag: tag,
          });
          unlinkSync(fileName);
        } catch (error) {
          this.emit("error", {
            type: "error",
            status: "serverSynthesize",
            time: Date.now(),
            message: String(error),
          });
        }
      } catch (error) {
        this.emit("error", {
          type: "error",
          status: "serverSynthesize",
          time: Date.now(),
          message: String(error),
        });
      }
    };
    this._taskRunner.addQueue(task);
  }
}
