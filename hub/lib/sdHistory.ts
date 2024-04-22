import sdCommandType from "../types/sdCommandType";

class SdHistory {
  private historyList: {
    user_id: string;
    command: sdCommandType;
  }[] = [];

  public findOne(id: string) {
    return this.historyList.find((v) => v.user_id === id);
  }

  public addOne(id: string, command: sdCommandType) {
    this.historyList.push({ user_id: id, command });
  }

  public updateOne(id: string, command: sdCommandType) {
    this.historyList = this.historyList.map((v) => {
      if (v.user_id === id) {
        return {
          user_id: id,
          command: {
            prompt: v.command.prompt + command.prompt,
            negative: v.command.negative + command.negative,
            batch: command.batch,
            steps: command.steps,
          },
        };
      } else {
        return v;
      }
    });
  }

  public deleteOne(id: string) {
    this.historyList = this.historyList.filter((v) => v.user_id !== id);
  }
}

export default SdHistory;
