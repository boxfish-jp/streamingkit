import type { MediaInfoMessage } from "kit_models";
import { useEffect, useState } from "react";
import { SocketClient } from "socket_client";

export const trackKey = (info: MediaInfoMessage) =>
  `${info.title}\n${info.artist}`;

export const useMusicInfo = () => {
  const [musicInfo, setMusicInfo] = useState<MediaInfoMessage | null>(null);

  useEffect(() => {
    const socket = SocketClient.instance();
    const remove = socket.on("message", (message) => {
      if (message.type !== "mediaInfo" || message.kind !== "music") {
        return;
      }
      setMusicInfo(message);
    });
    socket.setServerUrl(
      `${window.location.protocol}//${window.location.hostname}:${window.location.port}`,
    );

    return remove;
  }, []);

  return { musicInfo };
};
