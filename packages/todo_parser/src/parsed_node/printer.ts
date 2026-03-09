import type { ParsedNodesMap } from "./parsed_node.js";

export const printDocument = (parsedNodes: ParsedNodesMap): string => {
  return Array.from(parsedNodes.values())
    .map(
      (node) =>
        `${"*".repeat(node.depth)}${node.rawTag ? ` ${node.rawTag}` : ""} ${node.title}\n`,
    )
    .join("")
    .trim();
};
