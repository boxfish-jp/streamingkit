export type StreamInfo = {
  isStreaming: boolean;
  streamId?: number;
};

export type NotifyStreamingInfoCallback = (info: StreamInfo) => void;
