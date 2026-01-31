type WhereType = "orchestrator" | "client";

export interface ConnectionMessage {
  type: "connection";
  status: "ok" | "error";
  where: WhereType[];
}
