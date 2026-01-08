import { readdir } from "node:fs";
import type {
  Command,
  CommentMessage,
  InstSyntesizeMessage,
  VideoMessage,
} from "kit_models";
import { normalizeLowerCase } from "../clean.js";

export const getVideoCommands = async () => {
  const keywords = await new Promise<string[]>((resolve, reject) => {
    readdir("../../video", (err, files) => {
      if (err) {
        console.log("Unable to scan directory: ");
        reject(err);
      } else {
        const commands = files.map((file) => file.replace(".mp4", ""));
        resolve(commands);
      }
    });
  });

  const commands: Command[] = [];
  for (const keyword of keywords) {
    commands.push({
      isTarget: (comment) =>
        normalizeLowerCase(comment.content).startsWith(keyword),
      synthesize: (comment: CommentMessage) => {
        if (normalizeLowerCase(comment.content).length > keyword.length) {
          return {
            type: "instSynthesize",
            content: normalizeLowerCase(comment.content),
            tag: "comment",
          } as InstSyntesizeMessage;
        }
      },
      action: () => {
        return [
          {
            type: "video",
            name: keyword,
          } as VideoMessage,
        ];
      },
    });
  }

  const explosion = {
    isTarget: (comment) =>
      normalizeLowerCase(comment.content).startsWith("エクスプロージョン"),
    synthesize: (comment: CommentMessage) => {
      if (
        normalizeLowerCase(comment.content).length > "エクスプロージョン".length
      ) {
        return {
          type: "instSynthesize",
          content: normalizeLowerCase(comment.content),
          tag: "comment",
        } as InstSyntesizeMessage;
      }
    },
    action: () => {
      const explosionNumber = Math.floor(Math.random() * 4) + 1;
      return [
        {
          type: "video",
          name: `エクスプロージョン${explosionNumber}`,
        } as VideoMessage,
      ];
    },
  } as Command;

  commands.push(makeWildCardVideoCommand("?", "？"));
  commands.push(makeWildCardVideoCommand("8888", "８８８８"));
  commands.push(makeWildCardVideoCommand("５６す", "56す"));
  commands.push(makeWildCardVideoCommand("にっこにこに", "にっこにこにー"));
  commands.push(makeWildCardVideoCommand("にゃんぱす", "にゃんぱすー"));
  commands.push(makeWildCardVideoCommand("やっはろー", "やっはろ"));
  commands.push(makeWildCardVideoCommand("トゥットゥル", "トゥットゥルー"));
  commands.push(makeWildCardVideoCommand("馬鹿", "バカ"));
  commands.push(makeWildCardVideoCommand("ばか", "バカ"));
  commands.push(
    makeWildCardVideoCommand("これでかったと", "これで勝ったと思うなよ"),
  );
  commands.push(
    makeWildCardVideoCommand("これで勝ったと", "これで勝ったと思うなよ"),
  );
  commands.push(makeWildCardVideoCommand("無理", "ムリ"));
  commands.push(makeWildCardVideoCommand("むり", "ムリ"));
  commands.push(makeWildCardVideoCommand("かんぺき", "完璧"));
  commands.push(makeWildCardVideoCommand("幸せなら", "幸せならok"));
  commands.push(makeWildCardVideoCommand("しあわせなら", "幸せならok"));
  commands.push(makeWildCardVideoCommand("幸せならおｋ", "幸せならok"));
  commands.push(makeWildCardVideoCommand("気になります", "私気になります"));
  commands.push(makeWildCardVideoCommand("笑えばいい", "笑えばいいと思うよ"));
  commands.push(makeWildCardVideoCommand("ちょわよ", "チョワヨー"));
  commands.push(makeWildCardVideoCommand("ちょわよー", "チョワヨー"));
  commands.push(makeWildCardVideoCommand("チョワヨ", "チョワヨー"));
  commands.push(makeWildCardVideoCommand("いいね", "チョワヨー"));
  commands.push(makeWildCardVideoCommand("スキピ", "スピキ"));
  commands.push(makeWildCardVideoCommand("ｽﾋｷ", "スピキ"));
  commands.push(makeWildCardVideoCommand("すぴき", "スピキ"));
  commands.push(makeArrivalVideoCommand("のんのんびより", "にゃんぱすー"));
  commands.push(makeArrivalVideoCommand("無職", "働いたら負け"));
  commands.push(
    makeArrivalVideoCommand(
      "この素晴らしい世界に祝福を!",
      "エクスプロージョン1",
    ),
  );

  commands.push(
    makeArrivalVideoCommand("邪神ちゃんドロップキック", "ドロップキック"),
  );
  commands.push(makeArrivalVideoCommand("氷菓", "私気になります"));
  commands.push(makeArrivalVideoCommand("葬送のフリーレン", "ちっさ"));
  commands.push(makeArrivalVideoCommand("メイドインアビス", "おや"));
  commands.push(makeArrivalVideoCommand("ブルーアーカイブ", "完璧"));
  commands.push(makeArrivalVideoCommand("ｽﾋｷ", "スピキ"));
  commands.push(makeArrivalVideoCommand("ぼっちざろっく", "ムリ"));
  commands.push(makeArrivalVideoCommand("お兄ちゃんはおしまい！", "おはよう"));
  commands.push(makeArrivalVideoCommand("ゲーム", "ゲームのカード"));
  commands.push(makeArrivalVideoCommand("エヴァンゲリオン", "バカ"));
  commands.push(makeArrivalVideoCommand("ウマ娘 プリティーダービー", "わこつ"));

  return [...commands, explosion];
};

const makeWildCardVideoCommand = (wildcard: string, videoName: string) => {
  return {
    isTarget: (comment) =>
      normalizeLowerCase(comment.content).startsWith(wildcard),
    synthesize: (comment: CommentMessage) => {
      if (normalizeLowerCase(comment.content).length > wildcard.length) {
        return {
          type: "instSynthesize",
          content: normalizeLowerCase(comment.content),
          tag: "comment",
        } as InstSyntesizeMessage;
      }
    },
    action: () => {
      return [
        {
          type: "video",
          name: videoName,
        } as VideoMessage,
      ];
    },
  } as Command;
};

const makeArrivalVideoCommand = (category: string, videoName: string) => {
  return {
    isTarget: (commentMessage) => {
      return (
        commentMessage.label === "bot" &&
        commentMessage.content.startsWith(`「${category}」が好きな`)
      );
    },
    synthesize: (comment: CommentMessage) => {
      return {
        type: "instSynthesize",
        content: normalizeLowerCase(comment.content),
        tag: "comment",
      } as InstSyntesizeMessage;
    },
    action: () => {
      return [
        {
          type: "video",
          name: videoName,
        } as VideoMessage,
      ];
    },
  } as Command;
};
