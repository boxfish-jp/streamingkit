import sdCommandType from "../types/sdCommandType";

class SdParseCommand {
  private command: string = "";
  private promptKey = ["p:", "n:", "b:", "s:"];

  constructor(comment: string) {
    this.command = comment;
  }

  private cleanPrompt(input: string, searchPrompt: string) {
    let output = input;
    for (const key of this.promptKey) {
      if (key === searchPrompt) {
        continue;
      }
      const index = output.indexOf(key);
      if (index !== -1) {
        output = output.slice(0, index).trim();
      }
      output = output.trim();
    }
    output = output.replace(searchPrompt, "").trim().replace(",", "");
    return output;
  }

  private extractPrompt() {
    const result: string[] = [];
    for (const key of this.promptKey) {
      const index = this.command.indexOf(key);
      if (index !== -1) {
        const data = this.command.slice(index).trim();
        result.push(this.cleanPrompt(data, key));
      } else {
        result.push("");
      }
    }
    return result;
  }

  public parseCommand() {
    const result = this.extractPrompt();
    const batch =
      isNaN(Number(result[2])) || !Number(result[2]) ? 1 : Number(result[2]);
    const steps =
      isNaN(Number(result[3])) || !Number(result[3]) ? 50 : Number(result[3]);
    const compleateCommand: sdCommandType = {
      prompt: result[0],
      negative: result[1],
      batch: batch,
      steps: steps,
    };
    return compleateCommand;
  }
}

export default SdParseCommand;
