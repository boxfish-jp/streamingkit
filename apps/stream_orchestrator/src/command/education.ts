import type { Command, InstSyntesizeMessage } from "kit_models";
import type {
  AddEducationMessage,
  RemoveEducationMessage,
} from "kit_models/src/education.js";
import { normalizeLowerCase } from "../clean.js";

export const getEducationCommands = () => {
  const commands: Command[] = [];
  commands.push(
    {
      isTarget: (comment) => comment.content.startsWith("教育:"),
      synthesize: (comment) => {
        const edu = normalizeLowerCase(comment.content).split(":");
        if (edu.length !== 3) {
          return {
            type: "instSynthesize",
            content: "教育コマンドの形式が間違っています",
            tag: "comment",
          } as InstSyntesizeMessage;
        }
        return {
          type: "instSynthesize",
          content: `${edu[1]}は${edu[2]}と覚えました`,
          tag: "comment",
        } as InstSyntesizeMessage;
      },
      action: (comment) => {
        const edu = normalizeLowerCase(comment.content).split(":");
        if (edu.length !== 3) {
          return [];
        }
        return [
          {
            type: "addEducation",
            key: edu[1],
            value: edu[2],
          } as AddEducationMessage,
        ];
      },
    },
    {
      isTarget: (comment) =>
        normalizeLowerCase(comment.content).startsWith("忘却:"),
      synthesize: (comment) => {
        const edu = normalizeLowerCase(comment.content).split(":");
        if (edu.length !== 2) {
          return {
            type: "instSynthesize",
            content: "忘却コマンドの形式が間違っています",
            tag: "comment",
          } as InstSyntesizeMessage;
        }
        return {
          type: "instSynthesize",
          content: `${edu[1]}を忘れました`,
          tag: "comment",
        } as InstSyntesizeMessage;
      },
      action: (comment) => {
        const edu = normalizeLowerCase(comment.content).split(":");
        if (edu.length !== 2) {
          return [];
        }
        return [
          {
            type: "removeEducation",
            key: edu[1],
          } as RemoveEducationMessage,
        ];
      },
    },
  );
  return commands;
};
