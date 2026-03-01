import type { Message } from "kit_models";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";

export const App = () => {
  const socketRef = useRef<Socket>();
  const [videoName, setVideoName] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    const socket = io(url, {
      path: "/ws",
      parser: customParser,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("connect");
    });

    socket.on("message", (message: Message) => {
      if (message.type === "video") {
        const path = `${url}/video/${message.name}.mp4`;
        console.log(path);
        setVideoName(path);
      }
    });
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const onEnded = () => {
    setVideoName("");
  };

  return (
    <>
      <section className="h-36 flex justify-end w-full">
        {videoName && (
          // biome-ignore lint/a11y/useMediaCaption: <explanation>
          <video
            className="h-36"
            controls={false}
            onEnded={onEnded}
            src={videoName}
            autoPlay={true}
          />
        )}
      </section>
    </>
  );
};
