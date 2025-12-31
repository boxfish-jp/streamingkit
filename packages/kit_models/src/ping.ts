export interface PingMessage {
  type: "ping";
  who: "orchestrator" | "client";
}
