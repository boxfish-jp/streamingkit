import type { SqliteEducationStore } from "education_store";
import type { EducationConfig, OnMessage } from "kit_models";
import { sendCommentBothSites } from "./utils.js";

export const getEducationConfigs = (
  store: SqliteEducationStore,
): EducationConfig[] => store.getAll();

export const addEducationConfig = (
  store: SqliteEducationStore,
  config: EducationConfig,
  onMessage: OnMessage,
) => {
  store.add(config);
  for (const message of sendCommentBothSites(
    "bot: ありがとう、また一つ邪神ちゃんは賢くなりました",
  )) {
    onMessage(message);
  }
};

export const removeEducationConfig = (
  store: SqliteEducationStore,
  keyword: string,
) => {
  store.remove(keyword);
};
