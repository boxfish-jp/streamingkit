import type { EducationConfig } from "kit_models";
import { urlRegex } from "regexs";

// 大文字小文字などの正規化
export const normalizeLowerCase = (content: string) => {
  const textParts = content.split(urlRegex);
  const urlParts = content.match(urlRegex);

  let text = "";
  for (const part of textParts) {
    if (part === undefined) {
      text += urlParts?.shift() ?? "";
    } else if (part) {
      text += part
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
          String.fromCharCode(char.charCodeAt(0) - 0xfee0),
        )
        .replace(/[A-Za-z]/g, (char) => char.toLowerCase());
    }
  }
  return text;
};

// URLの置換や教育の実行
export const applyEducation = (
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
  content = content.replace(/w{4,}/g, "www");
  content = content.replace(/8{4,}/g, "");
  content = content.replace(/８{4,}/g, "");
  content = content.replace(/あ{4,}/g, "あああ");
  content = content.replace(/ぁ{4,}/g, "ぁぁぁ");
  return content;
};
