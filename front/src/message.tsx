import { split } from "sentence-splitter";

class Message {
  private message: string[] = [];

  setMessage(mess: string) {
    const sentences = split(mess);
    this.message.push(`c:wait:${mess.length}`);
    for (const sentence of sentences) {
      this.message.push(sentence.raw);
    }
  }

  getMessage() {
    if (this.message.length > 0) {
      const returnMess = this.message.shift();
      if (returnMess) {
        console.log(returnMess);
        return returnMess;
      }
    }
    return undefined;
  }
}

export default Message;
