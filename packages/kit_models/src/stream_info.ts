export type StreamInfoMessage = {
  type: "streaming_info";
  site: "niconico" | "youtube";
  isStreaming: boolean;
  wasStreaming: boolean;
  streamId?: string;
};

export type NotifyStreamingInfoCallback = (message: StreamInfoMessage) => void;
