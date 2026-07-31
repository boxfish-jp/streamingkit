import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ErrorMessage, SynthesizedMessage } from "kit_models";
import { TaskRunner } from "task_runner";

interface SynthesizeRunnerMessages {
  synthesized: [message: SynthesizedMessage];
  error: [message: ErrorMessage];
}

const voicepeakPath =
  process.env.VOICEPEAK_PATH || "/mountspace/Voicepeak/voicepeak";

export class SynthesizeRunner extends EventEmitter<SynthesizeRunnerMessages> {
  private _taskRunner = new TaskRunner();

  addQueue(text: string, channel: number, retryCount = 0) {
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
      const filePath = join(tmpdir(), `${Date.now()}.wav`);
      try {
        const result = spawn(voicepeakPath, ["-s", text, "-o", filePath], {
          stdio: ["pipe", "pipe", "inherit"],
        });

        try {
          const timeout = setTimeout(() => {
            this.emit("error", {
              type: "error",
              status: "serverSynthesizeDelay",
              time: Date.now(),
              message: "Timeout",
            });
          }, 30000);

          const status = await new Promise<number>((resolve, reject) => {
            result.on("close", resolve);
            result.on("error", reject);
          });

          clearTimeout(timeout);

          if (status !== 0) {
            this.addQueue(text, channel, retryCount + 1);
            return;
          }
          const data = readFileSync(filePath);
          this.emit("synthesized", {
            type: "synthesized",
            buffer: data,
            channel: channel,
          });
        } catch (error) {
          this.emit("error", {
            type: "error",
            status: "serverSynthesize",
            time: Date.now(),
            message: String(error),
          });
        } finally {
          try {
            unlinkSync(filePath);
          } catch {}
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
