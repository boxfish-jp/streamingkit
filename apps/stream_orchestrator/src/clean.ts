import type { EducationConfig } from "kit_models";
import { urlRegex } from "regexs";

// URLの置換や教育の実行
export const clean = (
  content: string,
  educationConfigs: EducationConfig[],
): string => {
  if (content.endsWith("好きなものリストに登録しました")) {
    return "";
  }
  content = content.replace(urlRegex, "URL省略");
  for (const config of educationConfigs) {
    content = content.replaceAll(config.key, config.value);
  }
  return content;
};
