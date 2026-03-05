import { readFile } from "node:fs/promises";

export const readUtf8File = async (path: string) => {
  console.log(`Reading file: ${path}`);
  const data = await readFile(path);
  return data.toString();
};
