import type { Message } from "kit_models";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";

export const App = () => {
  const socketRef = useRef<Socket>();
  const [videoPath, setVideoPath] = useState<string>("");

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
        setVideoPath(path);
      }
    });
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const onEnded = () => {
    setVideoPath("");
  };

  return (
    <>
      <section className="max-w-md max-h-125 flex justify-end w-full">
        {videoPath && (
          // biome-ignore lint/a11y/useMediaCaption: <explanation>
          <video
            controls={false}
            onEnded={onEnded}
            src={videoPath}
            autoPlay={true}
          />
        )}
      </section>
    </>
  );
};
