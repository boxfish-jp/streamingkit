import { useEffect, useRef, useState } from "react";
import { type Socket, io } from "socket.io-client";

const hostname = "localhost";
const port = "3000";

export const App = () => {
	const socketRef = useRef<Socket>();
	const [videoName, setVideoName] = useState<string>("");

	useEffect(() => {
		const socketUrl = `http://${hostname}:${port}`;
		const socket = io(socketUrl, { path: "/ws" });
		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("connect");
		});

		socket.on("play", (videoName: string) => {
			const name = `../../video/${videoName}.mp4`;
			console.log(name);
			setVideoName(name);
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
						controls
						onEnded={onEnded}
						src={videoName}
						autoPlay={true}
					/>
				)}
			</section>
		</>
	);
};
