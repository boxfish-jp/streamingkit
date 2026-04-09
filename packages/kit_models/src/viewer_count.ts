export interface viewerCountMessage {
  type: "viewerCountUpdate";
  site: "niconico" | "youtube";
  viewerCount: number;
}
