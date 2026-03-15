import type { Message } from "kit_models";
import { useCallback, useEffect, useRef, useState } from "react";
import { SocketClient } from "socket_client";

export const useSocket = () => {
  const socketRef = useRef<SocketClient>(SocketClient.instance());
  const [callbacks, setCallbacks] = useState<Array<(message: Message) => void>>(
    [],
  );

  const addOnMessage = useCallback((cb: (message: Message) => void) => {
    setCallbacks((prev) => [...prev, cb]);
    return () => {
      setCallbacks((prev) => prev.filter((fn) => fn !== cb));
    };
  }, []);

  useEffect(() => {
    const url = "http://192.168.68.11:8888";
    //const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    socketRef.current.setServerUrl(url);

    socketRef.current.on("connect", () => {
      console.log("connect");
    });

    socketRef.current.on("message", (message: Message) => {
      callbacks.forEach((cb) => cb(message));
    });
  }, [callbacks]);

  return [addOnMessage];
};
