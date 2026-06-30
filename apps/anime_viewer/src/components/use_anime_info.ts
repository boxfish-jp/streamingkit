import type { AnimeInfoMessage, Message } from "kit_models";
import { useEffect, useRef, useState } from "react";
import { SocketClient } from "socket_client";

export const useAnimeInfo = () => {
  const socketRef = useRef<SocketClient>(SocketClient.instance());
  const [animeInfo, setAnimeInfo] = useState<AnimeInfoMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    socketRef.current.setServerUrl(url);

    socketRef.current.on("connect", () => {
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("message", (message: Message) => {
      if (message.type === "animeInfo") {
        setAnimeInfo(message);
      }
    });
  }, []);

  return { animeInfo, isConnected };
};
