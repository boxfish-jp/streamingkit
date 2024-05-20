class VtubeAPI {
  private sendedList: {
    key: number;
    end: boolean;
  }[] = [];

  private vtubeCommentSetting = (comment: string) => {
    const ignoreList = [
      "続きを入力してね",
      "生成に成功しました",
      "/info 3",
      "URL省略",
    ];
    if (comment.startsWith("/info 10")) {
      comment = "「いらっしゃい」と行ってください。";
    }
    for (let ignore of ignoreList) {
      if (comment.startsWith(ignore)) {
        return;
      }
    }
    return comment;
  };

  private makeURL(comment: string, key: number) {
    const endpoint = new URL("http://192.168.68.110:8888");
    const params = new URLSearchParams();
    params.append("text", encodeURIComponent(comment));
    params.append("key", key.toString());
    endpoint.search = params.toString();
    return endpoint.href;
  }

  private setSendedList(key: number) {
    this.sendedList.push({ key: key, end: false });
  }

  private updateSendedList(key: number) {
    this.sendedList = this.sendedList.map((v) => {
      if (v.key === key) {
        return { key: key, end: true };
      } else {
        return v;
      }
    });
  }

  public async sendAPI(comme: string) {
    const comment = this.vtubeCommentSetting(comme);
    if (!comment) {
      return;
    }
    const key = new Date().getTime();
    const url = this.makeURL(comment, key);
    this.setSendedList(key);
    for (let i = 0; i <= 3; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          this.updateSendedList(key);
          return;
        }
      } catch (e) {}
    }
    this.updateSendedList(key);
    return "VtuberAPIが応答しませんでしたの";
  }
}

export default VtubeAPI;
