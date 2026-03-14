import { ComparisonResult } from "./comparison.js";
import { parseNodes } from "./parsed_node/parser.js";
import { UpdateResult } from "./update_result.js";

export const parseTodo = (oldFile: string, newFile: string) => {
  const oldNodeMap = parseNodes(oldFile);
  const newNodeMap = parseNodes(newFile);
  const comparisonResult = ComparisonResult.createFromParsedNodes(
    oldNodeMap,
    newNodeMap,
  );
  return UpdateResult.createFromComparisionResult(comparisonResult);
};

export { UpdateResult } from "./update_result.js";
