import { readFileSync, writeFileSync } from "node:fs";
import type { EducationConfig, OnMessage } from "kit_models";

export const getEducationConfigs = (
  onMessage: OnMessage,
): EducationConfig[] => {
  try {
    return JSON.parse(
      readFileSync("../../education.json", "utf-8"),
    ) as EducationConfig[];
  } catch (error) {
    console.log(error);
    onMessage({
      type: "error",
      status: "serverReadEducation",
      time: Date.now(),
      message: `Failed to read education config: ${error}`,
    });
    return [];
  }
};

export const addEducationConfig = (
  config: EducationConfig,
  onMessage: OnMessage,
) => {
  const configs = getEducationConfigs(onMessage);
  configs.push(config);
  try {
    writeFileSync(
      "../../education.json",
      JSON.stringify(configs, null, 2),
      "utf-8",
    );
  } catch (error) {
    onMessage({
      type: "error",
      status: "serverWriteEducation",
      time: Date.now(),
      message: `Failed to read education config: ${error}`,
    });
  }
};

export const removeEducationConfig = (
  keyword: string,
  onMessage: OnMessage,
) => {
  const configs = getEducationConfigs(onMessage).filter(
    (config) => config.key !== keyword,
  );
  try {
    writeFileSync(
      "../../education.json",
      JSON.stringify(configs, null, 2),
      "utf-8",
    );
  } catch (error) {
    onMessage({
      type: "error",
      status: "serverWriteEducation",
      time: Date.now(),
      message: `Failed to read education config: ${error}`,
    });
  }
};
