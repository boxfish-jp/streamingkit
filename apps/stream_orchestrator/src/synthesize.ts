import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { EventEmitter } from "node:stream";
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
      this.emit("synthesized", { type: "synthesized", buffer: data, tag: tag });
    };
    const errorHandler = (error: unknown) => {
      this.emit("error", {
        type: "error",
        status: "serverSynthesize",
        time: Date.now(),
        message: String(error),
      });
    };
    this._taskRunner.addQueue(task, errorHandler);
  }
}
