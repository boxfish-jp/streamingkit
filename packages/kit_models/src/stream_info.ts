export type StreamInfoMessage = {
  type: "streaming_info";
  isStreaming: boolean;
  streamId?: number;
};

export type NotifyStreamingInfoCallback = (message: StreamInfoMessage) => void;
