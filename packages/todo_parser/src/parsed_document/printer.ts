import type { ParsedDocument } from "../types/parsed_document.js";

export const printDocument = (parsedDocument: ParsedDocument): string => {
  return Array.from(parsedDocument.nodes.values())
    .map(
      (node) =>
        `${"*".repeat(node.depth)}${node.rawTag ? ` ${node.rawTag}` : ""} ${node.title}\n`,
    )
    .join("")
    .trim();
};
